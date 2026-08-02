<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\DataMigration;
use App\Support\Migration\DumpImporter;
use App\Support\Migration\SqlDump;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * Imports a backup of the old system into a brand-new branch.
 *
 * One file, one branch: the dump's own branches are merged into the branch the
 * user names here (see DumpImporter for why splitting them would corrupt the
 * sales data). The upload is never executed as SQL — it is read as data.
 */
class DataMigrationController extends Controller
{
    /** Tables the file must contain before we believe it's one of ours. */
    private const REQUIRED_TABLES = ['orders', 'order_items', 'products'];

    public function __construct(private readonly DumpImporter $importer) {}

    /**
     * Admin only: an import creates staff accounts and writes straight into the
     * tables every report reads from. Managers are deliberately excluded.
     */
    private function authorizeAdmin(): void
    {
        abort_unless(auth()->check() && auth()->user()->role === 'admin', 403);
    }

    public function index(): Response
    {
        $this->authorizeAdmin();

        return Inertia::render('Migrations/Index', [
            'migrations' => DataMigration::query()
                ->where('company_id', auth()->user()->company_id)
                ->with(['branch:id,name', 'user:id,name'])
                ->latest()
                ->limit(25)
                ->get(),
            'limits' => [
                'upload' => ini_get('upload_max_filesize'),
                'post' => ini_get('post_max_size'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            // branches.name is unique system-wide, so catch it here rather than
            // letting the insert blow up halfway through.
            'branch_name' => ['required', 'string', 'max:50', Rule::unique('branches', 'name')],
            'dump' => ['required', 'file', 'max:512000'],
        ], [], ['branch_name' => 'branch name', 'dump' => 'backup file']);

        $upload = $request->file('dump');

        if (strtolower($upload->getClientOriginalExtension()) !== 'sql') {
            return back()->withErrors(['dump' => 'That is not a .sql backup file.']);
        }

        // Reading and writing 100k+ rows outlives the defaults.
        set_time_limit(0);
        ini_set('memory_limit', '512M');

        // Kept outside the public disk; removed again once we're done with it.
        $path = $upload->storeAs(
            'data-migrations',
            uniqid('dump_', true).'.sql',
            ['disk' => 'local']
        );
        $fullPath = storage_path('app/'.$path);

        $user = auth()->user();

        try {
            $dump = new SqlDump($fullPath);
            $scan = $dump->scan(['branches']);
        } catch (Throwable $e) {
            @unlink($fullPath);

            return back()->withErrors(['dump' => 'That file could not be read as a MySQL backup.']);
        }

        $missing = array_diff(self::REQUIRED_TABLES, array_keys($scan['tables']));

        if ($missing !== []) {
            @unlink($fullPath);

            return back()->withErrors([
                'dump' => 'This backup has no '.implode(', ', $missing).' data — it does not look like a mauzodata backup.',
            ]);
        }

        // Created before the import so a failure still leaves a record behind.
        $record = DataMigration::create([
            'company_id' => $user->company_id,
            'user_id' => $user->id,
            'branch_name' => $validated['branch_name'],
            'original_name' => $upload->getClientOriginalName(),
            'size' => $upload->getSize(),
            'status' => DataMigration::IMPORTING,
            'source' => [
                'database' => $scan['source']['database'] ?? null,
                'server' => $scan['source']['server'] ?? null,
                'tables' => $scan['tables'],
                'branches' => array_map(
                    fn (array $b) => $b['name'],
                    $scan['captured']['branches'] ?? []
                ),
            ],
        ]);

        $started = microtime(true);

        try {
            $summary = DB::transaction(function () use ($dump, $scan, $validated, $user, $record) {
                $branch = Branch::create([
                    'company_id' => $user->company_id,
                    'name' => $validated['branch_name'],
                ]);

                $summary = $this->importer->import(
                    $dump,
                    $branch->id,
                    $user->company_id,
                    $scan['tables'],
                );

                $record->branch_id = $branch->id;

                return $summary;
            });
        } catch (Throwable $e) {
            @unlink($fullPath);

            $record->update([
                'status' => DataMigration::FAILED,
                'error' => $e->getMessage(),
                'duration_ms' => (int) ((microtime(true) - $started) * 1000),
            ]);

            return back()->withErrors([
                'dump' => 'The import failed and nothing was saved: '.$e->getMessage(),
            ]);
        }

        // The dump holds customer data; it has served its purpose.
        @unlink($fullPath);

        $record->update([
            'status' => DataMigration::IMPORTED,
            'summary' => $summary,
            'duration_ms' => (int) ((microtime(true) - $started) * 1000),
        ]);

        $rows = array_sum(array_column($summary, 'imported'));

        return back()->with(
            'success',
            "Imported {$rows} records into ".strtoupper($validated['branch_name']).'.'
        );
    }

    /** Clears a row out of the history. Imported data is untouched. */
    public function destroy(DataMigration $dataMigration): RedirectResponse
    {
        $this->authorizeAdmin();

        abort_unless($dataMigration->company_id === auth()->user()->company_id, 403);

        $dataMigration->delete();

        return back()->with('success', 'Migration record removed.');
    }
}
