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
        Schema::create('service_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('service_code');
            $table->string('cnae_code')->nullable();
            $table->text('description')->nullable();
            $table->decimal('default_rate', 6, 4)->nullable();
            $table->boolean('allow_retention')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_items');
    }
};
