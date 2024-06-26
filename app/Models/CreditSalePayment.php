<?php

namespace App\Models;

use App\Observers\CreditSalePaymentObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


#[ObservedBy(CreditSalePaymentObserver::class)]
class CreditSalePayment extends Model
{
    use HasFactory;

    protected $fillable = ['credit_sale_id', 'user_id', 'amount'];


    public function creditSale(): BelongsTo
    {
        return $this->belongsTo(CreditSale::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
