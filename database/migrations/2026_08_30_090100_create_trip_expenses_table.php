<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What a journey cost: mafuta, kupakia, kushusha, posho, mizani.
 *
 * Cascades with its trip — an expense has no meaning without the journey it
 * was spent on, so it should never outlive it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trip_expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trip_id')->constrained()->cascadeOnDelete();
            $table->string('category');
            $table->decimal('amount', 12, 2);
            $table->string('description', 160)->nullable();
            $table->date('spent_at');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index(['trip_id', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trip_expenses');
    }
};
