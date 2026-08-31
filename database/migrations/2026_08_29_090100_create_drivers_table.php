<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Who drives the trucks.
 *
 * Deliberately not users: a driver does not log in, and tying the two would
 * mean creating an account for everyone who ever takes a load out.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drivers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name', 80);
            $table->string('phone', 20)->nullable();
            $table->string('license_number', 40)->nullable();
            // Switched off rather than deleted once they have trips behind
            // them, so past journeys keep the name of who actually drove them.
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drivers');
    }
};
