<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What the client has actually handed over.
 *
 * Separate rows rather than a "paid" figure on the trip, because an advance
 * and a balance on delivery are two events — and knowing when the money came
 * is half of knowing whether the business has any.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trip_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trip_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->date('paid_at');
            $table->string('method', 40)->nullable();
            $table->string('note', 160)->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index('trip_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trip_payments');
    }
};
