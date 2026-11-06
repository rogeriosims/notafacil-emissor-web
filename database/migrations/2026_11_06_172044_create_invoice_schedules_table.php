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
        Schema::create('invoice_schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies')->onDelete('cascade');
            $table->uuid('template_invoice_id')->nullable();
            $table->string('type'); // MONTHLY
            $table->integer('day_of_month')->nullable();
            $table->date('next_emission_date')->nullable();
            $table->string('status')->default('ACTIVE');
            $table->string('description_template')->nullable();
            $table->timestamps();

            $table->index(['next_emission_date', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_schedules');
    }
};
