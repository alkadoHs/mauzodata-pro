<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One journey, one job: a truck takes one client's load somewhere for an
 * agreed price. This is the profit centre of the haulage business — the
 * expenses and payments hang off it, and every figure in the report is a sum
 * over these rows.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();

            // Deleting a truck or a client out from under a trip would leave a
            // journey nobody drove for nobody. Retiring them is the supported
            // move; the controllers say so, and this is the net beneath that.
            $table->foreignId('truck_id')->constrained()->restrictOnDelete();
            $table->foreignId('trip_client_id')->constrained()->restrictOnDelete();
            // Nullable: a trip can be recorded before anyone is assigned to it.
            $table->foreignId('driver_id')->nullable()->constrained()->restrictOnDelete();

            // Per-company counter behind the human reference (TRP-0001), so
            // one company's numbering doesn't skip because another was busy.
            $table->unsignedInteger('sequence');

            $table->string('origin', 80);
            $table->string('destination', 80);
            $table->string('cargo', 120)->nullable();
            $table->decimal('weight_tons', 8, 2)->nullable();

            // What the client agreed to pay to have this carried.
            $table->decimal('freight_amount', 12, 2);

            $table->string('status')->default('in_transit'); // in_transit | delivered | cancelled
            $table->date('dispatched_at');
            $table->date('delivered_at')->nullable();
            $table->text('notes')->nullable();

            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->unique(['company_id', 'sequence']);
            // The report reads by company and date, every time.
            $table->index(['company_id', 'dispatched_at']);
            $table->index(['company_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
