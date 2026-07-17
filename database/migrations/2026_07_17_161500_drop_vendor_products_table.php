<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Vendors are gone from the system. The table was never used in production
     * (no rows, no inbound foreign keys), so it drops cleanly.
     */
    public function up(): void
    {
        Schema::dropIfExists('vendor_products');
    }

    /**
     * Recreates the table as 2024_08_01_120034_create_vendor_products_table left
     * it, so a rollback lands on the same schema. The data is not restorable —
     * there was none.
     */
    public function down(): void
    {
        Schema::create('vendor_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('released_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('confirmed_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->integer('buy_price')->default(0);
            $table->integer('sale_price');
            $table->decimal('stock');
            $table->decimal('sold')->default(0);
            $table->string('status')->default('pending');
            $table->timestamps();
        });
    }
};
