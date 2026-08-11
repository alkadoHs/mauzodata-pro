<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * A fixed discount per line — 2000 off, not 10% off.
 *
 * The interesting part is the two generated columns. order_items.total and
 * .profit are computed by the database, and every report in the system sums
 * those columns rather than recomputing anything. So teaching the expressions
 * about the discount makes the sales report, the seller report, the product
 * report, the dashboard and the receipts all discount-aware at once, with no
 * query anywhere needing to change — and no risk of one place remembering to
 * subtract it while another forgets.
 *
 *   total  = quantity * price - discount
 *   profit = (price - buy_price) * quantity - discount
 *
 * total_buy_price is left alone: a discount comes out of the margin, it does
 * not change what the goods cost.
 *
 * Existing rows default to 0, so every historical figure stays exactly as it
 * was.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->decimal('discount', 12, 2)->default(0)->after('price');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->decimal('discount', 12, 2)->default(0)->after('price');
        });

        // Both are VIRTUAL, so redefining them is a metadata change — no table
        // rebuild even on a large order_items.
        DB::statement('ALTER TABLE `order_items`
            MODIFY COLUMN `total` int GENERATED ALWAYS AS ((`quantity` * `price`) - `discount`) VIRTUAL');
        DB::statement('ALTER TABLE `order_items`
            MODIFY COLUMN `profit` int GENERATED ALWAYS AS (((`price` - `buy_price`) * `quantity`) - `discount`) VIRTUAL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE `order_items`
            MODIFY COLUMN `total` int GENERATED ALWAYS AS ((`quantity` * `price`)) VIRTUAL');
        DB::statement('ALTER TABLE `order_items`
            MODIFY COLUMN `profit` int GENERATED ALWAYS AS (((`price` - `buy_price`) * `quantity`)) VIRTUAL');

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('discount');
        });

        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropColumn('discount');
        });
    }
};
