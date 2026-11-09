<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Office;
use App\Models\ServiceCode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class TaxSettingsAndCompanySettingsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Office $office;
    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();

        $this->office = Office::factory()->create(['name' => 'Escritório Auditoria']);
        $this->company = Company::factory()->create([
            'office_id' => $this->office->id,
            'name' => 'Empresa Exemplo LTDA',
            'cnpj' => '11222333000199',
            'fiscal_driver' => 'acbr',
        ]);

        $this->admin = User::factory()->create([
            'role' => 'PLATFORM_ADMIN',
            'email' => 'admin@notafacil.local',
        ]);
        $this->admin->companies()->attach($this->company->id);
    }

    public function test_company_settings_view_and_update(): void
    {
        // 1. View settings
        $response = $this->actingAs($this->admin)
            ->get(route('companies.settings'));

        $response->assertOk();

        // 2. Update company settings
        $response = $this->actingAs($this->admin)
            ->post(route('companies.settings.update'), [
                'name' => 'Empresa Exemplo Atualizada LTDA',
                'trade_name' => 'Fantasia Atualizada',
                'email' => 'fiscal@empresa.com.br',
                'phone' => '11988887777',
                'zip_code' => '01310-100',
                'street' => 'Avenida Paulista',
                'number' => '1000',
                'neighborhood' => 'Bela Vista',
                'city' => 'São Paulo',
                'state' => 'SP',
                'city_code' => '3550308',
                'op_simples_nacional' => 3,
                'apuracao_sn' => 1,
                'regime_especial_tributacao' => 0,
                'incentivo_fiscal' => true,
                'rps_series' => 'E',
                'rps_last_number' => 200,
                'fiscal_driver' => 'acbr',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('companies', [
            'id' => $this->company->id,
            'name' => 'Empresa Exemplo Atualizada LTDA',
            'trade_name' => 'Fantasia Atualizada',
            'incentivo_fiscal' => true,
            'rps_last_number' => 200,
        ]);
    }

    public function test_tax_settings_view_seed_and_import(): void
    {
        // 1. View tax settings backoffice
        $this->actingAs($this->admin)
            ->get(route('management.tax-settings.index'))
            ->assertOk();

        // 2. Seed default LC 116 codes
        $this->actingAs($this->admin)
            ->post(route('management.tax-settings.seed'))
            ->assertRedirect();

        $this->assertDatabaseHas('service_codes', ['code' => '1.01']);
        $this->assertDatabaseHas('service_codes', ['code' => '7.02']);

        // 3. Import custom CSV
        $csvContent = "CODIGO;DESCRICAO;ALIQUOTA_MIN;ALIQUOTA_MAX\n"
                    . "99.01;Serviço Especial de Teste CSV;2.50;5.00\n"
                    . "99.02;Outro Serviço Importado;3.00;4.00\n";

        $file = UploadedFile::fake()->createWithContent('tabela_lc116.csv', $csvContent);

        $response = $this->actingAs($this->admin)
            ->post(route('management.tax-settings.import'), [
                'file' => $file,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('service_codes', ['code' => '99.01']);
        $this->assertDatabaseHas('service_codes', ['code' => '99.02']);
    }
}
