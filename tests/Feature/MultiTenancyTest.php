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
    // TODO: Precisaremos criar o User e autenticá-lo, mas para o RED inicial do model Company:
    // Supondo que a lógica do scope aplique o office_id do usuário logado:
    // $user = User::factory()->create(['office_id' => $office1->id]);
    // $this->actingAs($user);

    // O scope deve limitar as empresas ao escritório do usuário autenticado.
    // Vamos simular a aplicação do escopo global. No momento isso falhará
    // porque Office e Company nem existem.
    $companies = Company::all();

    // 3. Assert
    expect($companies)->toHaveCount(3);
    foreach ($companies as $company) {
        expect($company->office_id)->toBe($office1->id);
    }
});
