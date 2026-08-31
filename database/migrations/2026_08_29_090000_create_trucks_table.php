<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The fleet.
 *
 * Scoped by company and nothing else — a truck does not belong to a shop
 * branch, so no branch_id here to let the shop's branch switcher hide one.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trucks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('plate_number', 20);
            // What people actually call it — "Mzee", "ile kubwa" — which is how
            // a driver or clerk will look for it, not by plate.
            $table->string('name', 60)->nullable();
            $table->string('make', 60)->nullable();
            $table->decimal('capacity_tons', 8, 2)->nullable();
            $table->string('status')->default('active'); // active | in_repair | sold
            $table->text('notes')->nullable();
            $table->timestamps();

            // Two trucks cannot share a plate within one company.
            $table->unique(['company_id', 'plate_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trucks');
    }
};
