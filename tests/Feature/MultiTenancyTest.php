<?php
// SPECSFY: AC-001

use App\Models\Office;
use App\Models\Company;

test('it filters companies by office id automatically via global scope', function () {
    // 1. Arrange: Criar 2 escritórios
    $office1 = Office::factory()->create();
    $office2 = Office::factory()->create();

    // Criar empresas associadas a cada escritório
    Company::factory()->count(3)->create(['office_id' => $office1->id]);
    Company::factory()->count(2)->create(['office_id' => $office2->id]);

    // 2. Act: Autenticar como um usuário do office1 e consultar empresas
    $user = \App\Models\User::factory()->create([
        'office_id' => $office1->id,
        'role' => 'OFFICE_USER',
    ]);
    $this->actingAs($user);

    $companies = Company::all();

    // 3. Assert
    expect($companies)->toHaveCount(3);
    foreach ($companies as $company) {
        expect($company->office_id)->toBe($office1->id);
    }
});
