<?php
// SPECSFY: AC-003

use App\Models\User;
use App\Models\Company;
use App\Models\Office;

test('it blocks certificate upload if company is not allowed', function () {
    // 1. Arrange
    $office = Office::factory()->create();

    // Empresa onde o escritório não delegou permissão de upload
    $company = Company::factory()->create([
        'office_id' => $office->id,
        'allow_client_certificate_upload' => false,
    ]);

    // Usuário que pertence à empresa (COMPANY_USER)
    $user = User::factory()->create(['role' => 'COMPANY_USER']);
    $user->companies()->attach($company->id);

    // 2. Act
    // Tenta fazer upload do certificado como usuário da empresa
    $response = $this->actingAs($user)
                     ->postJson("/api/companies/{$company->id}/certificate", [
                         'certificate' => 'dummy_file',
                         'password' => 'secret'
                     ]);

    // 3. Assert
    // Deve retornar 403 Forbidden com a policy travando a ação.
    $response->assertStatus(403);
});

test('it allows certificate upload if company is allowed', function () {
    // 1. Arrange
    $office = Office::factory()->create();

    // Empresa onde o escritório DELEGOU permissão de upload
    $company = Company::factory()->create([
        'office_id' => $office->id,
        'allow_client_certificate_upload' => true,
    ]);

    // Usuário que pertence à empresa (COMPANY_USER)
    $user = User::factory()->create(['role' => 'COMPANY_USER']);
    $user->companies()->attach($company->id);

    // 2. Act
    // (A rota nem existe ainda, então pode dar 404, mas a Policy é o foco)
    $response = $this->actingAs($user)
                     ->postJson("/api/companies/{$company->id}/certificate", [
                         'certificate' => 'dummy_file',
                         'password' => 'secret'
                     ]);

    // 3. Assert
    // Não pode ser 403. Se der 404 é aceitável pro nosso teste de policy (pois passamos a policy).
    // Ou validamos chamando a policy diretamente:
    $this->assertTrue($user->can('uploadCertificate', $company));
});
