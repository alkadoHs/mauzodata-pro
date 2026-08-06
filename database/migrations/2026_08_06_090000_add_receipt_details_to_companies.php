<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The registration details a receipt has to carry.
 *
 * A Tanzanian receipt heads with the trading name, the proprietor, the postal
 * address, the numbers customers call, and the two tax registrations: TIN and
 * VRN. Name, address and TIN (tax_id) were already here; these three were not.
 *
 * All optional — every company fills in its own from Setup → Company, and a
 * blank one simply doesn't print.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            // The proprietor, printed under the trading name.
            $table->string('owner_name')->nullable()->after('name');
            // Shops routinely publish two numbers on a receipt.
            $table->string('alt_phone')->nullable()->after('phone');
            // VAT Registration Number, alongside the TIN in tax_id.
            $table->string('vrn')->nullable()->after('tax_id');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['owner_name', 'alt_phone', 'vrn']);
        });
    }
};
