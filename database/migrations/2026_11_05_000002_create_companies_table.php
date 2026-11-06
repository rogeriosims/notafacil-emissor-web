<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('office_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->boolean('allow_client_certificate_upload')->default(false);
            $table->timestamps();

            $table->index('office_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
