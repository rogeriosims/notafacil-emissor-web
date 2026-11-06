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
        Schema::create('schedule_execution_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('schedule_id')->constrained('invoice_schedules')->onDelete('cascade');
            $table->uuid('invoice_id')->nullable();
            $table->string('status');
            $table->jsonb('details')->nullable();
            $table->timestamp('execution_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_execution_logs');
    }
};
