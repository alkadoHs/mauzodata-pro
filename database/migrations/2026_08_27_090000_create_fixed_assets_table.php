<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fixed_assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            // Null = company-wide — shared equipment that isn't any one branch's,
            // rather than belonging to a branch that no longer exists.
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            // Deliberately just a name, not a link to the products catalogue — a
            // fixed asset (a printer, a Pikipiki) is a different kind of thing
            // from stock that gets sold, even when the words overlap.
            $table->string('name');
            // What this specific item is worth, not a type-wide price — two of
            // the same computer can be recorded with two different values.
            $table->decimal('value', 12, 2);
            $table->string('status')->default('active'); // active | broken
            $table->text('notes')->nullable();
            $table->date('acquired_at')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index(['company_id', 'branch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fixed_assets');
    }
};
