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
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('name');
            $table->string('tax_id');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('street')->nullable();
            $table->string('number')->nullable();
            $table->string('neighborhood')->nullable();
            $table->string('city_code')->nullable();
            $table->string('state')->nullable();
            $table->string('zip_code')->nullable();
            $table->boolean('iss_withheld')->default(false);
            $table->timestamps();

            $table->unique(['company_id', 'tax_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
