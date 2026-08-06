<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Makes a transfer say where it came from, where each line is going, and what
 * actually arrived.
 *
 * Until now a transfer only took stock off the sending branch — nothing put it
 * onto the receiving one, so the destination re-keyed the delivery note by
 * hand. That is where duplicate products and stock landing on the wrong row
 * came from. Naming the destination product on the line itself removes the
 * guess.
 *
 * product_transfers.branch_id keeps its meaning (the destination) so existing
 * records and reports are untouched; from_branch_id fills in the half that was
 * never recorded.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_transfers', function (Blueprint $table) {
            $table->foreignId('from_branch_id')->nullable()->after('branch_id')
                ->constrained('branches')->nullOnDelete();
            $table->foreignId('received_by')->nullable()->after('user_id')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('received_at')->nullable()->after('status');
        });

        Schema::table('product_transfer_items', function (Blueprint $table) {
            // The row in the receiving branch this line lands on. Null while
            // the transfer is still being built: it is resolved on dispatch,
            // matching an existing product or creating one exactly once.
            $table->foreignId('to_product_id')->nullable()->after('product_id')
                ->constrained('products')->nullOnDelete();
            // What the receiver actually counted, which may be less than sent.
            $table->decimal('received_stock', 12, 2)->nullable()->after('stock');
            $table->decimal('to_stock_after', 12, 2)->nullable()->after('stock_after');
        });
    }

    public function down(): void
    {
        Schema::table('product_transfers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('from_branch_id');
            $table->dropConstrainedForeignId('received_by');
            $table->dropColumn('received_at');
        });

        Schema::table('product_transfer_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('to_product_id');
            $table->dropColumn(['received_stock', 'to_stock_after']);
        });
    }
};
