<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            // Contato e Endereço
            $table->string('email')->nullable()->after('trade_name');
            $table->string('phone', 30)->nullable()->after('email');
            $table->string('zip_code', 10)->nullable()->after('state');
            $table->string('street')->nullable()->after('zip_code');
            $table->string('number', 30)->nullable()->after('street');
            $table->string('complement')->nullable()->after('number');
            $table->string('neighborhood')->nullable()->after('complement');
            $table->string('city')->nullable()->after('neighborhood');

            // Configurações Fiscais e Tributárias (Padrão Nacional)
            $table->tinyInteger('op_simples_nacional')->default(1)->comment('1: Nao Optante, 2: MEI, 3: ME/EPP');
            $table->tinyInteger('apuracao_sn')->nullable()->comment('1: SN total, 2: ISS por fora, 3: Ambos por fora');
            $table->tinyInteger('regime_especial_tributacao')->default(0)->comment('0: Nenhum, 1: Cooperativa, 2: Estimativa, etc');
            $table->boolean('incentivo_fiscal')->default(false);

            // Controle de RPS e Prefeitura Municipal
            $table->string('city_hall_login')->nullable();
            $table->string('city_hall_password')->nullable();
            $table->integer('rps_last_lote')->default(0);
            $table->string('rps_series', 10)->default('1');
            $table->integer('rps_last_number')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'email', 'phone', 'zip_code', 'street', 'number', 'complement',
                'neighborhood', 'city', 'op_simples_nacional', 'apuracao_sn',
                'regime_especial_tributacao', 'incentivo_fiscal', 'city_hall_login',
                'city_hall_password', 'rps_last_lote', 'rps_series', 'rps_last_number',
            ]);
        });
    }
};
