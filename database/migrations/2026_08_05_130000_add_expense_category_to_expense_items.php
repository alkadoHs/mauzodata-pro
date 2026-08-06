<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Files each new expense line under a category.
 *
 * Nullable on purpose: every line recorded before today was free text and stays
 * exactly as it is. Only new lines carry a category.
 *
 * `item` keeps holding the label — the category's name is copied onto the line
 * as it is saved. That keeps every existing report working untouched, and means
 * renaming a category later doesn't quietly rewrite what past expenses were
 * filed under.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expense_items', function (Blueprint $table) {
            $table->foreignId('expense_category_id')->nullable()->after('expense_id')
                ->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('expense_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('expense_category_id');
        });
    }
};
