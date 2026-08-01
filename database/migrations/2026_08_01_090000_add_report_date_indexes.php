<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Date indexes for the reports.
 *
 * Every report filters on created_at over a date window, but none of these
 * tables had an index on it — so "today's sales" scanned every order, every
 * order item and every credit payment ever recorded. The reports now compare
 * against timestamp bounds instead of whereDate(), so these indexes are usable.
 *
 * orders and expenses lead with the branch column: the branch scope is always
 * applied first, so (branch_id, created_at) serves "this branch, this window"
 * in a single range scan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->index(['branch_id', 'created_at'], 'orders_branch_created_index');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->index('created_at', 'order_items_created_index');
        });

        Schema::table('credit_sale_payments', function (Blueprint $table) {
            // Collections list: scan payments inside the window.
            $table->index('created_at', 'credit_sale_payments_created_index');
            // Per-order "paid in this window" subquery: seek by credit sale,
            // then range-scan the dates.
            $table->index(['credit_sale_id', 'created_at'], 'credit_sale_payments_sale_created_index');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->index(['branch_id', 'created_at'], 'expenses_branch_created_index');
        });

        Schema::table('expense_items', function (Blueprint $table) {
            $table->index('created_at', 'expense_items_created_index');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_branch_created_index');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex('order_items_created_index');
        });

        Schema::table('credit_sale_payments', function (Blueprint $table) {
            $table->dropIndex('credit_sale_payments_created_index');
            $table->dropIndex('credit_sale_payments_sale_created_index');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropIndex('expenses_branch_created_index');
        });

        Schema::table('expense_items', function (Blueprint $table) {
            $table->dropIndex('expense_items_created_index');
        });
    }
};
