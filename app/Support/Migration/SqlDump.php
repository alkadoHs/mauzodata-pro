<?php

namespace App\Support\Migration;

use Generator;
use RuntimeException;

/**
 * Streaming reader for a mysqldump file.
 *
 * Nothing here executes SQL. The dump is *read* as data — we take the column
 * order from its CREATE TABLE statements and the values from its INSERTs, and
 * hand plain PHP arrays to the importer, which writes them with bound
 * parameters. A dump can therefore never run a statement against this database,
 * which is the whole point: the file is uploaded by a user.
 *
 * Memory is bounded by the longest line in the file, not by its size —
 * mysqldump caps extended inserts around 1 MB, so a 500 MB dump costs the same
 * as a 5 MB one.
 */
class SqlDump
{
    /**
     * MySQL's escape sequences. strtr() takes the longest match at each
     * position and never re-scans what it wrote, so "\\n" (an escaped
     * backslash followed by an n) correctly yields a backslash and an n.
     */
    private const UNESCAPE = [
        '\\\\' => '\\',
        "\\'" => "'",
        '\\"' => '"',
        '\\n' => "\n",
        '\\r' => "\r",
        '\\t' => "\t",
        '\\0' => "\0",
        '\\b' => "\x08",
        '\\Z' => "\x1a",
    ];

    /** One (value, value, ...) tuple, skipping over parentheses inside strings. */
    private const TUPLE = <<<'REGEX'
        /\((?:'(?:[^'\\]++|\\.)*+'|[^)'])*+\)/
        REGEX;

    /** A single value inside a tuple: quoted string, or a bare NULL / number. */
    private const VALUE = <<<'REGEX'
        /'((?:[^'\\]++|\\.)*+)'|([^,]++)/
        REGEX;

    /**
     * Rows handed over at a time. Bounds live memory: one INSERT line can hold
     * several thousand rows, and materialising them all at once cost ~70 MB on
     * the reference dump against a 128 MB limit.
     */
    private const BATCH = 1000;

    /** table => ordered column names, as declared by the dump. */
    private array $columns = [];

    public function __construct(private readonly string $path)
    {
        if (! is_readable($this->path)) {
            throw new RuntimeException('The uploaded dump could not be read.');
        }
    }

    /**
     * One pass over the file: how many rows each table holds, plus the full
     * contents of the (small) tables named in $capture.
     *
     * This is what the UI previews before anything is written.
     *
     * @param  array<int,string>  $capture
     * @return array{tables:array<string,int>, captured:array<string,array<int,array<string,?string>>>, source:array<string,string>}
     */
    public function scan(array $capture = []): array
    {
        $counts = [];
        $captured = array_fill_keys($capture, []);

        $this->each(null, function (string $table, array $rows) use (&$counts, &$captured, $capture): void {
            $counts[$table] = ($counts[$table] ?? 0) + count($rows);

            if (in_array($table, $capture, true)) {
                $captured[$table] = array_merge($captured[$table], $rows);
            }
        });

        ksort($counts);

        return [
            'tables' => $counts,
            'captured' => $captured,
            'source' => $this->source(),
        ];
    }

    /**
     * Stream one table's rows, in file order, as batches of column-keyed rows.
     *
     * Each yielded batch is one INSERT statement's worth of rows (~1 MB of
     * dump), which is also a sensible unit of work for the importer.
     *
     * @return Generator<int,array<int,array<string,?string>>>
     */
    public function rows(string $table): Generator
    {
        $handle = $this->open();

        try {
            $current = null;

            while (($line = fgets($handle)) !== false) {
                if ($this->isCreateTable($line)) {
                    $current = $this->tableName($line);
                    $this->columns[$current] = [];

                    continue;
                }

                if ($current !== null && $this->isColumnDefinition($line, $name)) {
                    $this->columns[$current][] = $name;

                    continue;
                }

                if ($line[0] === ')') {
                    $current = null;

                    continue;
                }

                if ($this->isInsert($line) && $this->tableName($line) === $table) {
                    yield from $this->parse($table, $line);
                }
            }
        } finally {
            fclose($handle);
        }
    }

    /**
     * Column order the dump declares for a table. Only known once the file has
     * been read up to that table's CREATE statement.
     *
     * @return array<int,string>
     */
    public function columnsFor(string $table): array
    {
        return $this->columns[$table] ?? [];
    }

    /** Where the dump came from, for the audit record. */
    private function source(): array
    {
        $handle = $this->open();
        $meta = [];

        try {
            // The provenance comment block is the first ~10 lines.
            for ($i = 0; $i < 12 && ($line = fgets($handle)) !== false; $i++) {
                if (preg_match('/^-- Host: \S+\s+Database: (\S+)/', $line, $m)) {
                    $meta['database'] = $m[1];
                }
                if (preg_match('/^-- Server version\s+(.+)$/', $line, $m)) {
                    $meta['server'] = trim($m[1]);
                }
            }
        } finally {
            fclose($handle);
        }

        return $meta;
    }

    /**
     * Walk the file once, handing every INSERT's rows to $onRows.
     *
     * @param  array<int,string>|null  $only  restrict to these tables (null = all)
     */
    private function each(?array $only, callable $onRows): void
    {
        $handle = $this->open();

        try {
            $current = null;

            while (($line = fgets($handle)) !== false) {
                if ($this->isCreateTable($line)) {
                    $current = $this->tableName($line);
                    $this->columns[$current] = [];

                    continue;
                }

                if ($current !== null && $this->isColumnDefinition($line, $name)) {
                    $this->columns[$current][] = $name;

                    continue;
                }

                if ($line[0] === ')') {
                    $current = null;

                    continue;
                }

                if (! $this->isInsert($line)) {
                    continue;
                }

                $table = $this->tableName($line);

                if ($only !== null && ! in_array($table, $only, true)) {
                    continue;
                }

                foreach ($this->parse($table, $line) as $batch) {
                    $onRows($table, $batch);
                }
            }
        } finally {
            fclose($handle);
        }
    }

    /**
     * Turn one `INSERT INTO x VALUES (..),(..);` line into batches of
     * column-keyed rows.
     *
     * Tuples are matched one at a time from a moving offset rather than with
     * preg_match_all: a single line can carry several thousand rows, and we
     * only ever want BATCH of them alive at once.
     *
     * @return Generator<int,array<int,array<string,?string>>>
     */
    private function parse(string $table, string $line): Generator
    {
        $offset = strpos($line, ' VALUES ');

        if ($offset === false) {
            return;
        }

        // What the statement says it is writing beats what the table declares.
        $columns = $this->insertColumns($line, $offset) ?? $this->columns[$table] ?? [];

        if ($columns === []) {
            throw new RuntimeException(
                "The dump inserts into `{$table}` before declaring its columns — it may be truncated."
            );
        }

        $offset += 8;
        $width = count($columns);
        $batch = [];

        while (preg_match(self::TUPLE, $line, $m, PREG_OFFSET_CAPTURE, $offset) === 1) {
            $offset = $m[0][1] + strlen($m[0][0]);
            $values = $this->values($m[0][0]);

            // A row that doesn't match the declared column count means the
            // parse drifted; better to stop than to import shifted data.
            if (count($values) !== $width) {
                throw new RuntimeException(
                    "A row in `{$table}` has ".count($values)." values but the table declares {$width} columns."
                );
            }

            $batch[] = array_combine($columns, $values);

            if (count($batch) === self::BATCH) {
                yield $batch;
                $batch = [];
            }
        }

        if ($batch !== []) {
            yield $batch;
        }
    }

    /**
     * The columns an INSERT names for itself, when it names any.
     *
     * MySQL 8's mysqldump writes `INSERT INTO t (a, b) VALUES ...` whenever a
     * table has generated columns, listing only the ones it can actually write
     * — on order_items that is nine columns against the twelve the table
     * declares. MariaDB writes a bare `INSERT INTO t VALUES ...` and leans on
     * the table's own order. So the row width has to come from the statement
     * when it offers one, and only fall back to the schema when it doesn't.
     *
     * @return array<int,string>|null
     */
    private function insertColumns(string $line, int $valuesAt): ?array
    {
        $open = strpos($line, '(', 0);

        if ($open === false || $open > $valuesAt) {
            return null;
        }

        preg_match_all('/`([^`]+)`/', substr($line, $open, $valuesAt - $open), $matches);

        return $matches[1] ?: null;
    }

    /**
     * Split one tuple into its values, unescaping strings and mapping NULL.
     *
     * @return array<int,?string>
     */
    private function values(string $tuple): array
    {
        preg_match_all(self::VALUE, substr($tuple, 1, -1), $matches, PREG_SET_ORDER);

        $values = [];

        foreach ($matches as $match) {
            if ($match[0][0] === "'") {
                $values[] = strtr($match[1], self::UNESCAPE);

                continue;
            }

            $values[] = $match[0] === 'NULL' ? null : $match[0];
        }

        return $values;
    }

    private function open()
    {
        $handle = fopen($this->path, 'rb');

        if ($handle === false) {
            throw new RuntimeException('The uploaded dump could not be opened.');
        }

        return $handle;
    }

    /** Cheap first-character tests keep the non-matching 99% of lines free. */
    private function isCreateTable(string $line): bool
    {
        return $line[0] === 'C' && str_starts_with($line, 'CREATE TABLE ');
    }

    private function isInsert(string $line): bool
    {
        return $line[0] === 'I' && str_starts_with($line, 'INSERT INTO ');
    }

    /**
     * Column definitions are the only lines inside CREATE TABLE that start
     * with whitespace then a backtick — KEY / UNIQUE KEY / PRIMARY KEY /
     * CONSTRAINT all start with a letter.
     */
    private function isColumnDefinition(string $line, ?string &$name): bool
    {
        if ($line[0] !== ' ') {
            return false;
        }

        if (preg_match('/^\s+`([^`]+)`\s/', $line, $m) !== 1) {
            return false;
        }

        $name = $m[1];

        return true;
    }

    private function tableName(string $line): string
    {
        preg_match('/`([^`]+)`/', $line, $m);

        return $m[1] ?? '';
    }
}
