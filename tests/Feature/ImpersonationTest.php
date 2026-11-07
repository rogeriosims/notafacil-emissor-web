<?php
// SPECSFY: AC-002

use App\Models\User;
use App\Models\Company;
use App\Models\Office;

test('it applies impersonation context using X-Impersonate-Company-Id header', function () {
    // 1. Arrange
    $office = Office::factory()->create();
    $company1 = Company::factory()->create(['office_id' => $office->id]);
    $company2 = Company::factory()->create(['office_id' => $office->id]);

    // Usuário do escritório que tem acesso às duas empresas
    $user = User::factory()->create([
        'office_id' => $office->id,
        'role' => 'OFFICE_USER',
    ]);

    // 2. Act
    // Fazemos uma requisição simulando a aba que está com o contexto da company2
    $response = $this->actingAs($user)
                     ->withHeader('X-Impersonate-Company-Id', $company2->id)
                     ->getJson('/api/current-context'); // Uma rota dummy que testaremos se o context foi setado

    // 3. Assert
    // O tenant_id ativo na requisição deve ser da company2 e não da company1.
    // E o middleware deve garantir que a injeção do tenant id prevaleça.
    $response->assertStatus(200)
             ->assertJson([
                 'active_company_id' => $company2->id,
             ]);
});
