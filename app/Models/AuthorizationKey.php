<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A key an admin issues to authorize a critical action (editing or deleting a
 * product). Only the hash is stored — see App\Support\AuthorizationKeys.
 */
class AuthorizationKey extends Model
{
    use HasFactory;

    /** Actions a key can authorize. Add to this to protect more endpoints. */
    public const ABILITIES = [
        'product.update' => 'Edit a product',
        'product.delete' => 'Delete a product',
    ];

    protected $fillable = [
        'company_id',
        'name',
        'key_hash',
        'hint',
        'abilities',
        'single_use',
        'expires_at',
        'used_at',
        'used_by',
        'created_by',
    ];

    /** key_hash is never exposed to the front end. */
    protected $hidden = ['key_hash'];

    protected function casts(): array
    {
        return [
            'abilities' => 'array',
            'single_use' => 'boolean',
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function usedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'used_by');
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    /** Spent: a single-use key that has already been redeemed. */
    public function isSpent(): bool
    {
        return $this->single_use && $this->used_at !== null;
    }

    public function isActive(): bool
    {
        return ! $this->isExpired() && ! $this->isSpent();
    }

    public function status(): string
    {
        return match (true) {
            $this->isSpent() => 'used',
            $this->isExpired() => 'expired',
            default => 'active',
        };
    }

    public function hasAbility(string $ability): bool
    {
        return in_array($ability, $this->abilities ?? [], true);
    }
}
