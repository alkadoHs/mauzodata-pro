<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('authorization_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            // Only the hash is stored — the plaintext is shown once at creation.
            $table->string('key_hash');
            // Last 4 characters, so a key is recognisable in the list without
            // revealing it (e.g. "••••K7QF").
            $table->string('hint', 8);
            // Which critical actions this key authorizes, e.g. ["product.update"].
            $table->json('abilities');
            $table->boolean('single_use')->default(false);
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('used_at')->nullable();
            $table->foreignId('used_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['company_id', 'used_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('authorization_keys');
    }
};
