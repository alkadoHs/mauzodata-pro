<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name')->unique();
            $table->string('email')->unique()->nullable();
            $table->string('city');
            $table->string('address');
            $table->string('tax_id')->nullable();
            $table->enum('plan', ['FREE', 'INDIVIDUAL', 'FAMILY', 'PREMIUM'])->default('FREE');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
