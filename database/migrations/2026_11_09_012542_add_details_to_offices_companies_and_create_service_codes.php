<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Enriquecer Offices
        Schema::table('offices', function (Blueprint $table) {
            $table->string('document', 20)->nullable()->after('name');
            $table->string('email')->nullable()->after('document');
            $table->string('phone', 30)->nullable()->after('email');
        });

        // Enriquecer Companies
        Schema::table('companies', function (Blueprint $table) {
            $table->string('cnpj', 20)->nullable()->after('name');
            $table->string('trade_name')->nullable()->after('cnpj');
            $table->string('municipal_registration', 50)->nullable()->after('trade_name');
            $table->string('city_code', 10)->nullable()->after('municipal_registration');
            $table->string('state', 2)->nullable()->after('city_code');
        });

        // Tabela Oficial de Itens da LC 116/2003
        Schema::create('service_codes', function (Blueprint $table) {
            $table->string('code', 10)->primary(); // Ex: 1.01, 1.02, 7.02
            $table->text('description');
            $table->decimal('min_rate', 5, 2)->default(2.00);
            $table->decimal('max_rate', 5, 2)->default(5.00);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_codes');

        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['cnpj', 'trade_name', 'municipal_registration', 'city_code', 'state']);
        });

        Schema::table('offices', function (Blueprint $table) {
            $table->dropColumn(['document', 'email', 'phone']);
        });
    }
};
