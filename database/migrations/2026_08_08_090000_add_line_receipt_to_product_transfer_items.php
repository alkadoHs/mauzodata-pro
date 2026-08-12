<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lets a delivery be counted in one line at a time, and records what went back.
 *
 * Receiving used to be all-or-nothing: one button settled every line at once.
 * A real delivery is unpacked item by item, so each line now carries its own
 * receipt — when it was counted and by whom — and the transfer closes itself
 * once the last line is done.
 *
 * returned_stock is the quantity that never arrived. It is not a note: that
 * stock goes back onto the sending branch's shelf when the line is confirmed,
 * so the two branches still add up to what left.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_transfer_items', function (Blueprint $table) {
            $table->decimal('returned_stock', 12, 2)->default(0)->after('received_stock');
            $table->timestamp('received_at')->nullable()->after('to_stock_after');
            $table->foreignId('received_by')->nullable()->after('received_at')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('product_transfer_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('received_by');
            $table->dropColumn(['returned_stock', 'received_at']);
        });
    }
};
