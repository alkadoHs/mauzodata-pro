<?php

namespace App\Models;

use App\Models\Filters\CreatedABetweenFilter;
use App\Models\Scopes\BranchScope;
use App\Observers\OrderObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\ScopedBy;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;
use Lacodix\LaravelModelFilter\Traits\HasFilters;
use Lacodix\LaravelModelFilter\Traits\IsSearchable;

#[ObservedBy(OrderObserver::class)]
#[ScopedBy(BranchScope::class)]
class Order extends Model
{
    use HasFactory, IsSearchable, HasFilters;

    protected $fillable = [
        'user_id',
        'payment_method_id',
        'branch_id',
        'customer_id',
        'paid',
        'print_invoice',
        'invoice_number',
        'status'
    ];

    protected array $filters = [
        CreatedABetweenFilter::class,
    ];
    
    protected array $searchable = ['id'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function creditSale(): HasOne
    {
        return $this->hasOne(CreditSale::class);
    }

    /**
     * All credit-sale payments made against this order (through its credit sale).
     * For credit orders this is the true amount paid, including the down payment.
     */
    public function creditSalePayments(): HasManyThrough
    {
        return $this->hasManyThrough(
            CreditSalePayment::class,
            CreditSale::class,
            'order_id',        // FK on credit_sales -> orders.id
            'credit_sale_id',  // FK on credit_sale_payments -> credit_sales.id
            'id',              // local key on orders
            'id'               // local key on credit_sales
        );
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }


}
