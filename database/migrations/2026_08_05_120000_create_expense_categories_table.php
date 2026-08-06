<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The list of things a shop spends money on — Chakula, Mafuta and so on.
 *
 * Company-wide, like payment methods and suppliers: every branch spends on the
 * same kinds of things, and one shared list is what stops the same category
 * being typed five different ways.
 *
 * Categories are switched off rather than deleted once they've been used, so
 * past expenses keep the name they were filed under.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expense_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name', 50);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // One "Mafuta" per company, whatever the casing — the column
            // collation is case-insensitive.
            $table->unique(['company_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_categories');
    }
};
