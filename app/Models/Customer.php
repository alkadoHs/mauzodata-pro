<?php

namespace App\Models;

use App\Models\Scopes\BranchScope;
use Illuminate\Database\Eloquent\Attributes\ScopedBy;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

#[ScopedBy(BranchScope::class)]
class Customer extends Model
{
    use HasFactory;

    protected $fillable = ['branch_id', 'name', 'contact'];

    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn (string $name): string => Str::title($name),
            set: fn (string $name): string => strtolower($name),
        );
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
