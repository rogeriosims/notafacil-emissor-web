<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Office;
use App\Models\ServiceCode;
use App\Models\ServiceItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ManagementWebControllersTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Office $office;
    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();

        $this->office = Office::factory()->create(['name' => 'Escritório Matriz Alpha']);
        $this->company = Company::factory()->create([
            'office_id' => $this->office->id,
            'name' => 'Tech Solutions LTDA',
            'cnpj' => '12345678000199',
        ]);

        $this->admin = User::factory()->create([
            'role' => 'PLATFORM_ADMIN',
            'email' => 'admin@notafacil.local',
        ]);
        $this->admin->companies()->attach($this->company->id);
    }

    public function test_office_crud_web_lifecycle(): void
    {
        // 1. Index
        $this->actingAs($this->admin)
            ->get(route('management.offices.index'))
            ->assertOk();

        // 2. Create
        $this->actingAs($this->admin)
            ->get(route('management.offices.create'))
            ->assertOk();

        // 3. Store
        $response = $this->actingAs($this->admin)
            ->post(route('management.offices.store'), [
                'name' => 'Escritório Beta Contabilidade',
                'document' => '98765432000188',
                'email' => 'contato@betacontabil.com.br',
                'phone' => '11999998888',
            ]);
        $response->assertRedirect(route('management.offices.index'));
        $this->assertDatabaseHas('offices', ['name' => 'Escritório Beta Contabilidade']);

        // 4. Edit
        $createdOffice = Office::where('name', 'Escritório Beta Contabilidade')->firstOrFail();
        $this->actingAs($this->admin)
            ->get(route('management.offices.edit', $createdOffice->id))
            ->assertOk();

        // 5. Update
        $this->actingAs($this->admin)
            ->put(route('management.offices.update', $createdOffice->id), [
                'name' => 'Escritório Beta Atualizado',
                'document' => '98765432000188',
                'email' => 'financeiro@betacontabil.com.br',
            ])
            ->assertRedirect();
        $this->assertDatabaseHas('offices', ['name' => 'Escritório Beta Atualizado']);

        // 6. Delete
        $this->actingAs($this->admin)
            ->delete(route('management.offices.destroy', $createdOffice->id))
            ->assertRedirect(route('management.offices.index'));
        $this->assertDatabaseMissing('offices', ['id' => $createdOffice->id]);
    }

    public function test_company_crud_web_lifecycle(): void
    {
        // 1. Index
        $this->actingAs($this->admin)
            ->get(route('management.companies.index'))
            ->assertOk();

        // 2. Create
        $this->actingAs($this->admin)
            ->get(route('management.companies.create'))
            ->assertOk();

        // 3. Store
        $response = $this->actingAs($this->admin)
            ->post(route('management.companies.store'), [
                'office_id' => $this->office->id,
                'name' => 'Nova Empresa Criada LTDA',
                'cnpj' => '44.555.666/0001-77',
                'op_simples_nacional' => 1,
                'regime_especial_tributacao' => 0,
                'incentivo_fiscal' => false,
                'fiscal_driver' => 'acbr',
            ]);
        $response->assertRedirect(route('management.companies.index'));
        $this->assertDatabaseHas('companies', ['cnpj' => '44555666000177']);

        // 4. Edit
        $newCompany = Company::where('cnpj', '44555666000177')->firstOrFail();
        $this->actingAs($this->admin)
            ->get(route('management.companies.edit', $newCompany->id))
            ->assertOk();

        // 5. Update
        $this->actingAs($this->admin)
            ->put(route('management.companies.update', $newCompany->id), [
                'office_id' => $this->office->id,
                'name' => 'Nova Empresa Renomeada LTDA',
                'cnpj' => '44555666000177',
                'op_simples_nacional' => 3,
                'apuracao_sn' => 1,
                'rps_series' => 'NF',
                'rps_last_number' => 105,
                'fiscal_driver' => 'acbr',
            ])
            ->assertRedirect();
        $this->assertDatabaseHas('companies', [
            'id' => $newCompany->id,
            'name' => 'Nova Empresa Renomeada LTDA',
            'rps_last_number' => 105,
        ]);
    }

    public function test_borrower_crud_web_lifecycle(): void
    {
        // 1. Index
        $this->actingAs($this->admin)
            ->get(route('borrowers.index'))
            ->assertOk();

        // 2. Create
        $this->actingAs($this->admin)
            ->get(route('borrowers.create'))
            ->assertOk();

        // 3. Store
        $this->actingAs($this->admin)
            ->post(route('borrowers.store'), [
                'name' => 'Cliente Tomador Exemplo',
                'tax_id' => '11.222.333/0001-44',
                'email' => 'financeiro@cliente.com',
                'zip_code' => '01001-000',
                'street' => 'Praça da Sé',
                'number' => '100',
                'neighborhood' => 'Sé',
                'city_code' => '3550308',
                'state' => 'SP',
                'iss_withheld' => true,
            ])
            ->assertRedirect(route('borrowers.index'));

        $borrower = Customer::where('tax_id', '11222333000144')->firstOrFail();

        // 4. Edit
        $this->actingAs($this->admin)
            ->get(route('borrowers.edit', $borrower->id))
            ->assertOk();

        // 5. Update
        $this->actingAs($this->admin)
            ->put(route('borrowers.update', $borrower->id), [
                'name' => 'Cliente Tomador Atualizado',
                'tax_id' => '11222333000144',
                'email' => 'novo@cliente.com',
                'iss_withheld' => false,
            ])
            ->assertRedirect(route('borrowers.index'));

        $this->assertDatabaseHas('customers', [
            'id' => $borrower->id,
            'name' => 'Cliente Tomador Atualizado',
            'iss_withheld' => false,
        ]);

        // 6. Delete
        $this->actingAs($this->admin)
            ->delete(route('borrowers.destroy', $borrower->id))
            ->assertRedirect(route('borrowers.index'));
        $this->assertDatabaseMissing('customers', ['id' => $borrower->id]);
    }

    public function test_service_item_crud_web_lifecycle(): void
    {
        ServiceCode::create([
            'code' => '1.01',
            'description' => 'Análise e desenvolvimento de sistemas',
            'min_rate' => 2.00,
            'max_rate' => 5.00,
        ]);

        // 1. Index
        $this->actingAs($this->admin)
            ->get(route('services.index'))
            ->assertOk();

        // 2. Create
        $this->actingAs($this->admin)
            ->get(route('services.create'))
            ->assertOk();

        // 3. Store
        $this->actingAs($this->admin)
            ->post(route('services.store'), [
                'service_code' => '1.01',
                'description' => 'Desenvolvimento de software web e mobile',
                'default_rate' => 2.50,
                'cnae_code' => '6201-5/01',
                'allow_retention' => true,
            ])
            ->assertRedirect(route('services.index'));

        $service = ServiceItem::where('service_code', '1.01')->firstOrFail();

        // 4. Edit
        $this->actingAs($this->admin)
            ->get(route('services.edit', $service->id))
            ->assertOk();

        // 5. Update
        $this->actingAs($this->admin)
            ->put(route('services.update', $service->id), [
                'service_code' => '1.01',
                'description' => 'Desenvolvimento e Manutenção de Plataformas',
                'default_rate' => 3.00,
                'allow_retention' => false,
            ])
            ->assertRedirect(route('services.index'));

        $this->assertDatabaseHas('service_items', [
            'id' => $service->id,
            'default_rate' => 3.00,
            'allow_retention' => false,
        ]);

        // 6. Delete
        $this->actingAs($this->admin)
            ->delete(route('services.destroy', $service->id))
            ->assertRedirect(route('services.index'));
        $this->assertDatabaseMissing('service_items', ['id' => $service->id]);
    }
}
