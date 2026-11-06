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
        Schema::create('invoice_batches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies')->onDelete('cascade');
            $table->integer('total_records')->default(0);
            $table->integer('processed_records')->default(0);
            $table->integer('error_records')->default(0);
            $table->string('status')->default('PENDING');
            $table->jsonb('errors')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_batches');
    }
};
