<?php

namespace App\Support\Migration;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

/**
 * Imports an old-system mysqldump into one freshly created branch.
 *
 * The old database is itself a mauzodata database, so the table shapes line up
 * and the job is a remap rather than a translation:
 *
 *  - every branch-scoped row is stamped with the new branch, and the dump's own
 *    branches are ignored. Splitting the dump by its branches is not offered on
 *    purpose: in real data roughly half the order lines point at a product
 *    filed under a different branch, so any per-branch split would silently
 *    drop line items and corrupt the sales totals.
 *  - ids are not looked up row by row. Each table gets one offset — the
 *    destination's current MAX(id) — and every id and foreign key is shifted by
 *    the offset of the table it points at. That turns the whole remap into
 *    arithmetic, so a 120k-row dump needs no id map in memory.
 *  - the column list is the intersection of what the dump declares and what the
 *    destination will accept, so generated columns (order_items.total, profit,
 *    …) are skipped and a schema that has drifted still imports.
 *
 * Everything runs inside one transaction with foreign key checks left ON: a
 * dump that references a row it doesn't contain fails loudly instead of
 * quietly writing orphans.
 */
class DumpImporter
{
    /**
     * What to import, parents before children. Anything not listed here
     * (carts, sessions, cache, jobs, migrations, vendor_products, …) is
     * deliberately left behind.
     *
     * strategy  'offset' (default) shifts ids; 'match' reuses an existing row
     *           when one already matches, else inserts and remembers the id.
     * branch    stamp the new branch_id.
     * company   stamp the importing user's company_id.
     * fks       column => table it points at.
     * null      columns to blank out (they point at things we don't import).
     */
    private const PLAN = [
        'users' => [
            'strategy' => 'match', 'match' => 'email',
            'company' => true, 'branch' => true, 'null' => ['store_id'],
        ],
        'payment_methods' => ['strategy' => 'match', 'match' => 'name', 'company' => true],
        'suppliers' => ['strategy' => 'match', 'match' => 'name', 'company' => true],

        'customers' => ['branch' => true],
        'products' => ['branch' => true],

        'orders' => ['branch' => true, 'fks' => [
            'user_id' => 'users', 'customer_id' => 'customers', 'payment_method_id' => 'payment_methods',
        ]],
        'order_items' => ['fks' => ['order_id' => 'orders', 'product_id' => 'products']],

        'credit_sales' => ['fks' => [
            'order_id' => 'orders', 'user_id' => 'users', 'customer_id' => 'customers',
        ]],
        'credit_sale_payments' => ['fks' => ['credit_sale_id' => 'credit_sales', 'user_id' => 'users']],

        'expenses' => ['branch' => true, 'fks' => ['user_id' => 'users']],
        'expense_items' => ['fks' => ['expense_id' => 'expenses']],

        'new_stocks' => ['fks' => ['product_id' => 'products']],

        'purchase_orders' => ['branch' => true, 'fks' => ['user_id' => 'users', 'supplier_id' => 'suppliers']],
        'purchase_order_items' => ['fks' => ['purchase_order_id' => 'purchase_orders', 'product_id' => 'products']],

        'product_transfers' => ['branch' => true, 'fks' => ['user_id' => 'users']],
        'product_transfer_items' => ['fks' => ['product_transfer_id' => 'product_transfers', 'product_id' => 'products']],

        'stock_transfers' => ['branch' => true, 'fks' => ['released_by' => 'users', 'product_id' => 'products']],
    ];

    /**
     * Bound values per INSERT — roughly 170 rows of a wide table.
     *
     * Measured on the 128k-row reference dump: 2000 / 8000 / 20000 all import
     * in ~6.6s, but peak memory climbs 74 → 98 → 114 MB. Bigger batches buy
     * nothing here and PHP's default limit is 128 MB, so stay small.
     */
    private const PLACEHOLDERS_PER_INSERT = 2000;

    private int $branchId;

    private int $companyId;

    /** table => MAX(id) in the destination before the import started. */
    private array $offsets = [];

    /** offset tables: table => [oldId => true] for rows actually written. */
    private array $kept = [];

    /** match tables: table => [oldId => newId]. */
    private array $mapped = [];

    /** table => [column => ['insertable' => bool, 'nullable' => bool, 'safe' => bool]] */
    private array $schema = [];

    /**
     * @return array<string,array{imported:int,skipped:int,reused:int}>
     */
    public function import(SqlDump $dump, int $branchId, int $companyId, array $rowCounts): array
    {
        $this->branchId = $branchId;
        $this->companyId = $companyId;
        $this->offsets = $this->kept = $this->mapped = [];

        $result = [];

        foreach (self::PLAN as $table => $spec) {
            // Nothing in the file, or a table this dump predates.
            if (($rowCounts[$table] ?? 0) === 0) {
                continue;
            }

            // A feature this deployment doesn't have yet: leave that data behind
            // rather than failing the whole import over it.
            if (! Schema::hasTable($table)) {
                continue;
            }

            $result[$table] = ($spec['strategy'] ?? 'offset') === 'match'
                ? $this->importMatched($dump, $table, $spec)
                : $this->importShifted($dump, $table, $spec);
        }

        return $result;
    }

    /**
     * Bulk path: shift ids by this table's offset and write in chunks.
     */
    private function importShifted(SqlDump $dump, string $table, array $spec): array
    {
        $this->offsets[$table] = (int) DB::table($table)->max('id');

        // Only remember which rows landed when something later points back at
        // them. Leaf tables are the big ones — tracking order_items would cost
        // 70k array entries that nothing would ever read.
        $track = in_array($table, $this->referencedTables(), true);
        $this->kept[$table] = [];

        $imported = 0;
        $skipped = 0;
        $columns = null;
        $buffer = [];
        $chunk = 0;

        foreach ($dump->rows($table) as $batch) {
            // The dump's column order is only known once its rows arrive.
            if ($columns === null) {
                $columns = $this->columnsFor($table, array_keys($batch[0]));
                $chunk = max(1, intdiv(self::PLACEHOLDERS_PER_INSERT, count($columns)));
            }

            foreach ($batch as $row) {
                $mapped = $this->remap($table, $spec, $row, $columns);

                if ($mapped === null) {
                    $skipped++;

                    continue;
                }

                if ($track) {
                    $this->kept[$table][(int) $row['id']] = true;
                }

                $buffer[] = $mapped;

                if (count($buffer) === $chunk) {
                    DB::table($table)->insert($buffer);
                    $imported += count($buffer);
                    $buffer = [];
                }
            }
        }

        if ($buffer !== []) {
            DB::table($table)->insert($buffer);
            $imported += count($buffer);
        }

        return ['imported' => $imported, 'skipped' => $skipped, 'reused' => 0];
    }

    /**
     * Small, shared tables (staff, payment methods, suppliers): reuse the row
     * that already exists rather than creating a duplicate, and remember which
     * new id each old id became.
     */
    private function importMatched(SqlDump $dump, string $table, array $spec): array
    {
        $this->mapped[$table] = [];

        $imported = 0;
        $reused = 0;
        $columns = null;

        foreach ($dump->rows($table) as $batch) {
            if ($columns === null) {
                $columns = $this->columnsFor($table, array_keys($batch[0]));
            }

            foreach ($batch as $row) {
                $existing = $this->findExisting($table, $spec, $row);

                if ($existing !== null) {
                    $this->mapped[$table][(int) $row['id']] = $existing;
                    $reused++;

                    continue;
                }

                $values = $this->remap($table, $spec, $row, $columns);

                if ($values === null) {
                    continue;
                }

                // Let the destination assign the id — these tables are small and
                // shared, so an offset would be more surprising than useful.
                unset($values['id']);

                $this->mapped[$table][(int) $row['id']] = (int) DB::table($table)->insertGetId($values);
                $imported++;
            }
        }

        return ['imported' => $imported, 'skipped' => 0, 'reused' => $reused];
    }

    /**
     * A row already standing in for this one, or null.
     *
     * Users match on email across the whole system (it is unique there);
     * everything else matches by name inside the importing company.
     */
    private function findExisting(string $table, array $spec, array $row): ?int
    {
        if ($table === 'users') {
            return $this->existingUser($row);
        }

        $column = $spec['match'];
        $value = $row[$column] ?? null;

        if ($value === null || $value === '') {
            return null;
        }

        $id = DB::table($table)
            ->where('company_id', $this->companyId)
            ->where($column, $value)
            ->value('id');

        return $id === null ? null : (int) $id;
    }

    /**
     * The same person, already in this company — matched on either of the two
     * things that identify them: the address they log in with or the number
     * they're reached on. Both are unique system-wide.
     *
     * Another company's account is never touched; remap() gives the import a
     * free address and number instead.
     */
    private function existingUser(array $row): ?int
    {
        $email = $row['email'] ?? null;
        $phone = $row['phone'] ?? null;

        // Without either, there is nothing to match on — and an empty OR would
        // match every user in the company.
        if (blank($email) && blank($phone)) {
            return null;
        }

        $id = DB::table('users')
            ->where('company_id', $this->companyId)
            ->where(function ($query) use ($email, $phone) {
                if (filled($email)) {
                    $query->orWhere('email', $email);
                }
                if (filled($phone)) {
                    $query->orWhere('phone', $phone);
                }
            })
            ->value('id');

        return $id === null ? null : (int) $id;
    }

    /**
     * One dump row → one destination row, or null when it has to be dropped.
     */
    private function remap(string $table, array $spec, array $row, array $columns): ?array
    {
        $values = [];

        foreach ($columns as $column) {
            $values[$column] = $row[$column] ?? null;
        }

        foreach ($spec['fks'] ?? [] as $column => $target) {
            if (! array_key_exists($column, $values) || $values[$column] === null) {
                continue;
            }

            $new = $this->resolve($target, (int) $values[$column]);

            if ($new !== null) {
                $values[$column] = $new;

                continue;
            }

            // The row it points at never made it in. Blank the link if the
            // schema allows, otherwise this row cannot exist — drop it.
            if (! $this->schema($table)[$column]['nullable']) {
                return null;
            }

            $values[$column] = null;
        }

        foreach ($spec['null'] ?? [] as $column) {
            if (array_key_exists($column, $values)) {
                $values[$column] = null;
            }
        }

        if ($spec['branch'] ?? false) {
            $values['branch_id'] = $this->branchId;
        }

        if ($spec['company'] ?? false) {
            $values['company_id'] = $this->companyId;
        }

        if ($table === 'users') {
            // Both are unique system-wide, and this person belongs to another
            // company here, so neither can be taken as-is.
            $values['email'] = $this->freeEmail((string) ($values['email'] ?? ''));
            $values['phone'] = $this->freePhone($values['phone'] ?? null);
        }

        // Match tables let the destination assign ids, so they have no offset.
        if (isset($values['id'], $this->offsets[$table])) {
            $values['id'] = (int) $values['id'] + $this->offsets[$table];
        }

        return $values;
    }

    /**
     * Tables some other table's foreign key points at.
     *
     * @return array<int,string>
     */
    private function referencedTables(): array
    {
        static $tables = null;

        // array_values first: PLAN is keyed by table name, and spreading a
        // string-keyed array passes them as named arguments.
        return $tables ??= array_values(array_unique(array_merge(
            ...array_values(array_map(fn (array $spec) => array_values($spec['fks'] ?? []), self::PLAN))
        )));
    }

    /** Old id in $table → the id it now has here, or null if it wasn't imported. */
    private function resolve(string $table, int $oldId): ?int
    {
        if (isset($this->mapped[$table])) {
            return $this->mapped[$table][$oldId] ?? null;
        }

        if (! isset($this->kept[$table][$oldId])) {
            return null;
        }

        return $oldId + $this->offsets[$table];
    }

    /**
     * The columns to carry over: what the dump has, that the destination will
     * accept. Generated columns are excluded — MySQL rejects writes to them.
     *
     * @param  array<int,string>  $dumpColumns
     * @return array<int,string>
     */
    private function columnsFor(string $table, array $dumpColumns): array
    {
        $schema = $this->schema($table);

        $columns = array_values(array_filter(
            $dumpColumns,
            fn (string $c) => ($schema[$c]['insertable'] ?? false)
        ));

        // A column this destination requires that the dump has no value for
        // would fail mid-import with a bare SQL error; say so up front.
        foreach ($schema as $name => $meta) {
            if (! $meta['insertable'] || $meta['safe'] || in_array($name, $columns, true)) {
                continue;
            }

            throw new RuntimeException(
                "This dump has no `{$name}` column for `{$table}`, which this system requires. ".
                'The backup is probably from an incompatible version.'
            );
        }

        return $columns;
    }

    /**
     * @return array<string,array{insertable:bool,nullable:bool,safe:bool}>
     */
    private function schema(string $table): array
    {
        if (isset($this->schema[$table])) {
            return $this->schema[$table];
        }

        $columns = [];

        foreach (DB::select('SHOW COLUMNS FROM `'.$table.'`') as $column) {
            $extra = strtoupper($column->Extra ?? '');
            $nullable = strtoupper($column->Null ?? '') === 'YES';

            $columns[$column->Field] = [
                'insertable' => ! str_contains($extra, 'GENERATED'),
                'nullable' => $nullable,
                // Fine to leave out of an INSERT: it fills itself in.
                'safe' => $nullable
                    || $column->Default !== null
                    || str_contains($extra, 'AUTO_INCREMENT'),
            ];
        }

        return $this->schema[$table] = $columns;
    }

    /**
     * Keep an imported address if it's free, otherwise tag it so the old
     * account can still be told apart from whoever already owns the address.
     */
    private function freeEmail(string $email): string
    {
        if ($email === '' || ! DB::table('users')->where('email', $email)->exists()) {
            return $email;
        }

        [$name, $domain] = array_pad(explode('@', $email, 2), 2, 'example.com');

        for ($i = 1; $i < 100; $i++) {
            $candidate = "{$name}+migrated{$i}@{$domain}";

            if (! DB::table('users')->where('email', $candidate)->exists()) {
                return $candidate;
            }
        }

        throw new RuntimeException("Could not find a free email address for {$email}.");
    }

    /**
     * Phone numbers are unique system-wide but optional, so a number someone
     * else already holds is simply left off. A mangled number would be worse
     * than a blank one — nobody can call it, and it looks real.
     */
    private function freePhone(?string $phone): ?string
    {
        if (blank($phone)) {
            return null;
        }

        return DB::table('users')->where('phone', $phone)->exists() ? null : $phone;
    }
}
