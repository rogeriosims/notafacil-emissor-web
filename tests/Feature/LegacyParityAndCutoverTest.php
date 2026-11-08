<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Console\Commands\ImportLegacySupabaseCommand;
use App\Domain\Fiscal\DTOs\CanonicalInvoiceDTO;
use App\Domain\Fiscal\Services\TaxEngineService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * SPECSFY: AC-001
 * Cobre: US-001, US-002, US-003, FR-001, FR-002, FR-003, NFR-001, NFR-002
 */
it('validates tax calculation parity with legacy fixtures', function () {
    $service = new TaxEngineService();
    $fixtures = json_decode(file_get_contents(__DIR__ . '/../Fixtures/Legacy/parity_cases.json'), true);

    foreach ($fixtures as $fixture) {
        $dto = new CanonicalInvoiceDTO(
            $fixture['input']['serviceValue'],
            $fixture['input']['allowRetention'],
            $fixture['input']['opSimpNac'],
            $fixture['input']['issWithheldByTomador'],
            $fixture['input']['issDueAtExecution'],
            $fixture['input']['snRetentionSubject'],
            $fixture['input']['issRate'],
            $fixture['input']['isAnexoIV'],
            $fixture['input']['hasCessaoMaoDeObra'],
            $fixture['input']['isTomadorCpf']
        );

        $result = $service->calculate($dto);

        expect($result->iss->rate)->toEqual($fixture['expected']['iss']['rate'])
            ->and($result->iss->value)->toEqual($fixture['expected']['iss']['value'])
            ->and($result->iss->isRetained)->toEqual($fixture['expected']['iss']['retained']);

        expect($result->inss->rate)->toEqual($fixture['expected']['inss']['rate'])
            ->and($result->inss->value)->toEqual($fixture['expected']['inss']['value'])
            ->and($result->inss->isRetained)->toEqual($fixture['expected']['inss']['retained']);

        expect($result->irrf->rate)->toEqual($fixture['expected']['irrf']['rate'])
            ->and($result->irrf->value)->toEqual($fixture['expected']['irrf']['value'])
            ->and($result->irrf->isRetained)->toEqual($fixture['expected']['irrf']['retained'])
            ->and($result->irrf->dispensedByAdr005)->toEqual($fixture['expected']['irrf']['adr005']);

        expect($result->csrf->totalRate)->toEqual($fixture['expected']['csrf']['rate'])
            ->and($result->csrf->totalValue)->toEqual($fixture['expected']['csrf']['totalValue'])
            ->and($result->csrf->pisValue)->toEqual($fixture['expected']['csrf']['pis'])
            ->and($result->csrf->cofinsValue)->toEqual($fixture['expected']['csrf']['cofins'])
            ->and($result->csrf->csllValue)->toEqual($fixture['expected']['csrf']['csll'])
            ->and($result->csrf->isRetained)->toEqual($fixture['expected']['csrf']['retained'])
            ->and($result->csrf->dispensedByAdr005)->toEqual($fixture['expected']['csrf']['adr005']);

        expect($result->netValue)->toEqual($fixture['expected']['netValue']);
    }
});

/**
 * SPECSFY: AC-002
 * Cobre: US-001, US-002, US-003, FR-001, FR-002, FR-003, NFR-001, NFR-002
 */
it('imports legacy data idempotently via artisan command', function () {
    $companyId = Str::uuid()->toString();
    $officeId = Str::uuid()->toString();
    DB::table('offices')->insert(['id' => $officeId, 'name' => 'Test Office', 'created_at' => now(), 'updated_at' => now()]);
    DB::table('companies')->insert(['id' => $companyId, 'office_id' => $officeId, 'name' => 'Legacy Company', 'created_at' => now(), 'updated_at' => now()]);

    $invoice1Id = Str::uuid()->toString();
    $invoice2Id = Str::uuid()->toString();

    $data = [
        [
            'id' => $invoice1Id,
            'company_id' => $companyId,
            'status' => 'AUTHORIZED',
            'number' => '100',
            'series' => '1',
            'service_amount' => 1000.0,
            'net_amount' => 950.0,
            'borrower_snapshot' => ['name' => 'Client A'],
            'iss_snapshot' => ['rate' => 5],
            'federal_taxes_snapshot' => ['irrf' => 15]
        ],
        [
            'id' => $invoice2Id,
            'company_id' => $companyId,
            'status' => 'DRAFT',
            'number' => null,
            'series' => null,
            'service_amount' => 500.0,
            'net_amount' => 500.0,
            'borrower_snapshot' => ['name' => 'Client B'],
            'iss_snapshot' => ['rate' => 2],
            'federal_taxes_snapshot' => null
        ]
    ];

    $filePath = storage_path('app/legacy_data.json');
    file_put_contents($filePath, json_encode($data));

    // Run first time
    $this->artisan('fiscalflow:import-legacy-supabase', ['file' => $filePath])
        ->assertExitCode(0);

    expect(DB::table('invoices')->count())->toEqual(2);
    expect(DB::table('invoices')->where('id', $invoice1Id)->exists())->toBeTrue();
    expect(DB::table('invoices')->where('id', $invoice2Id)->exists())->toBeTrue();

    // Run second time (Idempotency check)
    $this->artisan('fiscalflow:import-legacy-supabase', ['file' => $filePath])
        ->assertExitCode(0);

    expect(DB::table('invoices')->count())->toEqual(2);

    @unlink($filePath);
});

/**
 * SPECSFY: AC-003
 * Cobre: US-001, US-002, US-003, FR-001, FR-002, FR-003, NFR-001, NFR-002
 */
it('verifies post-cutover data integrity', function () {
    $companyId = Str::uuid()->toString();
    $officeId = Str::uuid()->toString();
    DB::table('offices')->insert(['id' => $officeId, 'name' => 'Test Office', 'created_at' => now(), 'updated_at' => now()]);
    DB::table('companies')->insert(['id' => $companyId, 'office_id' => $officeId, 'name' => 'Test', 'created_at' => now(), 'updated_at' => now()]);

    $invoiceId = Str::uuid()->toString();
    DB::table('invoices')->insert([
        'id' => $invoiceId,
        'company_id' => $companyId,
        'status' => 'AUTHORIZED',
        'borrower_snapshot' => json_encode(['name' => 'Test Borrower']),
        'iss_snapshot' => json_encode(['rate' => 5.0]),
        'created_at' => now(),
        'updated_at' => now()
    ]);

    $this->artisan('fiscalflow:verify-cutover')
        ->assertExitCode(0);

    // Now introduce an error
    DB::table('invoices')->where('id', $invoiceId)->update(['status' => 'UNDEFINED']);

    $this->artisan('fiscalflow:verify-cutover')
        ->assertFailed();
});
