<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The people whose mizigo the trucks carry.
 *
 * Kept apart from the shop's customers on purpose: someone who hires a lorry
 * is not someone who buys sugar over the counter, and mixing them would put
 * haulage clients into the shop's customer list and credit reports.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trip_clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name', 80);
            $table->string('phone', 20)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trip_clients');
    }
};
