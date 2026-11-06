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

    // 2. Act & Assert
    $this->assertFalse($user->can('uploadCertificate', $company));
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

    // 2. Act & Assert
    $this->assertTrue($user->can('uploadCertificate', $company));
});
