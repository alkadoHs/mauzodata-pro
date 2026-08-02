<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One old-system dump that was imported into a branch.
 *
 * Not branch-scoped: it is a company-level audit record, and a failed import
 * has no branch at all.
 */
class DataMigration extends Model
{
    use HasFactory;

    public const IMPORTING = 'importing';

    public const IMPORTED = 'imported';

    public const FAILED = 'failed';

    protected $fillable = [
        'company_id', 'branch_id', 'user_id', 'branch_name',
        'original_name', 'size', 'status', 'source', 'summary', 'error', 'duration_ms',
    ];

    protected function casts(): array
    {
        return [
            'source' => 'array',
            'summary' => 'array',
            'size' => 'integer',
            'duration_ms' => 'integer',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Rows actually written across every table. */
    public function rowsImported(): int
    {
        return array_sum(array_column($this->summary ?? [], 'imported'));
    }
}
