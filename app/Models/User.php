<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'company_id',
        'branch_id',
        'name',
        'email',
        'phone',
        'role',
        'isActive',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'isActive' => 'boolean',
        ];
    }

    public const ROLES = ['admin', 'manager', 'seller'];

    /**
     * Roles the given actor is allowed to hand out.
     *
     * Only an admin can make an admin. A manager creating one would escalate
     * past their own level — and straight into the tier that controls
     * authorization keys.
     *
     * @return array<int,string>
     */
    public static function assignableRoles(?self $actor): array
    {
        return $actor?->isAdmin()
            ? self::ROLES
            : ['manager', 'seller'];
    }

    /**
     * Admins only — deliberately excludes managers. Used for things a manager
     * must not control, such as issuing authorization keys (a manager who could
     * mint their own key would defeat the point of gating destructive actions).
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function carts(): HasOne
    {
        return $this->hasOne(Cart::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function creditSales(): HasMany
    {
        return $this->hasMany(CreditSale::class);
    }

    public function creditSalePayments(): HasMany
    {
        return $this->hasMany(CreditSalePayment::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function expenseItems(): HasManyThrough
    {
        return $this->hasManyThrough(ExpenseItem::class, Expense::class);
    }
    

    public function orderItems(): HasManyThrough
    {
        return $this->hasManyThrough(OrderItem::class, Order::class);
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }
}
