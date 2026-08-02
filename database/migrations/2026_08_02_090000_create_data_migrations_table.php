<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Audit trail for old-system imports: one row per uploaded dump, holding what
 * the file contained and what landed where. The dump itself is deleted once
 * the import finishes — only this record survives.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_migrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            // Kept on the record even if the branch is later deleted, so the
            // history still shows the import happened.
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('branch_name');
            $table->string('original_name');
            $table->unsignedBigInteger('size')->default(0);
            $table->string('status')->default('importing');
            // What the file said about itself: source database, server, and the
            // branches it contained (which are merged into the one new branch).
            $table->json('source')->nullable();
            // Per-table imported / skipped / reused counts.
            $table->json('summary')->nullable();
            $table->text('error')->nullable();
            $table->unsignedInteger('duration_ms')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_migrations');
    }
};
