<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What the business costs to keep running, between journeys.
 *
 * Insurance, road licences, servicing, salaries, parking. None of it belongs
 * to any one trip, which is exactly why it needs its own home: without it the
 * "profit" figure is only trip margin wearing a bigger word, and it would
 * flatter the business by every shilling recorded here.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('running_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            // Some of it belongs to a lorry (its insurance, its service);
            // some belongs to the business (salaries, office). Null is the
            // second kind, not a missing value.
            $table->foreignId('truck_id')->nullable()->constrained()->nullOnDelete();
            $table->string('category');
            $table->decimal('amount', 12, 2);
            $table->string('description', 160)->nullable();
            $table->date('spent_at');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index(['company_id', 'spent_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('running_costs');
    }
};
