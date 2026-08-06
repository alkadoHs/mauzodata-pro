<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Stock moving from one branch to another.
 *
 * Lifecycle: PENDING while the sender builds it, TRANSFERRED once the stock has
 * left the sending branch, RECEIVED once the destination has counted it in.
 * Stock only lands on the receiving branch at that last step — goods in transit
 * belong to neither.
 *
 * branch_id is the destination (it has always meant that); from_branch_id is
 * where it left.
 */
class ProductTransfer extends Model
{
    public const PENDING = 'pending';

    public const TRANSFERRED = 'transferred';

    public const RECEIVED = 'received';

    protected $fillable = [
        'branch_id', 'from_branch_id', 'user_id', 'received_by', 'status', 'received_at',
    ];

    protected function casts(): array
    {
        return ['received_at' => 'datetime'];
    }

    /**
     * Deliveries the receiving branch still has to count in.
     *
     * from_branch_id exists only on transfers made since receiving was added,
     * so it doubles as the line between old and new: everything sent before
     * that was settled by hand under the previous process and must not
     * reappear as work to do. Those records stay exactly as they are — they
     * are simply not deliveries anyone is waiting for.
     */
    public function scopeAwaitingReceipt(Builder $query): void
    {
        $query->where('status', self::TRANSFERRED)->whereNotNull('from_branch_id');
    }

    /** Sent under the old process, before the receiving step existed. */
    public function predatesReceiving(): bool
    {
        return $this->from_branch_id === null;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    /** The destination. */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function fromBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'from_branch_id');
    }

    public function productTransferItems(): HasMany
    {
        return $this->hasMany(ProductTransferItem::class);
    }
}
