<?php

use App\Enums\InvoiceStatus;
use App\Models\Company;
use App\Models\Invoice;
use App\Models\InvoiceBatch;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use App\Jobs\ProcessBatchRowJob;
use App\Exceptions\BatchDeletionBlockedException;

beforeEach(function () {
    Bus::fake();
});

it('upload valid spreadsheet dispatches jobs and creates drafts', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $user->companies()->attach($company->id);

    $this->actingAs($user);

    $csvContent = "document,name,email,service_value,iss_rate,is_simples_nacional\n";
    for ($i = 1; $i <= 50; $i++) {
        $csvContent .= "99.888.777/0001-{$i},Test Company {$i},test{$i}@example.com,1000.00,3.00,0\n";
    }
    $file = UploadedFile::fake()->createWithContent('invoices.csv', $csvContent);

    $response = $this->withHeaders([
        'X-Impersonate-Company-Id' => $company->id
    ])->postJson('/api/batches', [
        'file' => $file
    ]);

    $response->assertStatus(202);
    $response->assertJsonStructure(['batch_id', 'message']);

    $batchId = $response->json('batch_id');
    $batch = InvoiceBatch::find($batchId);
    
    $this->assertNotNull($batch);
    $this->assertEquals(50, $batch->total_records);
    
    Bus::assertBatched(function ($batch) {
        return $batch->jobs->count() === 50;
    });

    $row = [
        'document' => '99.888.777/0001-66',
        'name' => 'Novo Tomador',
        'email' => 'novo@example.com',
        'service_value' => '1000.00',
        'iss_rate' => '3.00',
        'is_simples_nacional' => '0'
    ];

    $job = new ProcessBatchRowJob($batch->id, $company->id, $row);
    $job->handle(app(\App\Domain\Fiscal\Services\TaxEngineService::class));

    $this->assertDatabaseHas('customers', [
        'tax_id' => '99.888.777/0001-66',
        'company_id' => $company->id
    ]);

    $this->assertDatabaseHas('invoices', [
        'batch_id' => $batch->id,
        'company_id' => $company->id,
        'status' => InvoiceStatus::DRAFT->value
    ]);
    
    $batch->refresh();
    $this->assertEquals(1, $batch->processed_records);
})->group('SPECSFY:AC-001', 'SPECSFY:AC-002');

it('reject spreadsheet exceeding 300 rows', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $user->companies()->attach($company->id);

    $this->actingAs($user);

    $csvContent = "document,name,email,service_value,iss_rate,is_simples_nacional\n";
    for ($i = 1; $i <= 301; $i++) {
        $csvContent .= "99.888.777/0001-{$i},Test Company {$i},test{$i}@example.com,1000.00,3.00,0\n";
    }
    $file = UploadedFile::fake()->createWithContent('invoices.csv', $csvContent);

    $response = $this->withHeaders([
        'X-Impersonate-Company-Id' => $company->id
    ])->postJson('/api/batches', [
        'file' => $file
    ]);

    $response->assertStatus(422);
    $response->assertJsonFragment(['message' => 'O limite máximo por lote é de 300 linhas']);
})->group('SPECSFY:AC-001');

it('invalid tax rate logs error', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $batch = InvoiceBatch::create(['company_id' => $company->id, 'total_records' => 1]);

    $row = [
        'document' => '99.888.777/0001-66',
        'name' => 'Novo Tomador',
        'email' => 'novo@example.com',
        'service_value' => '1000.00',
        'iss_rate' => '8.00',
        'is_simples_nacional' => '0'
    ];

    $job = new ProcessBatchRowJob($batch->id, $company->id, $row);
    $job->handle(app(\App\Domain\Fiscal\Services\TaxEngineService::class));

    $batch->refresh();
    $this->assertEquals(1, $batch->error_records);
    $this->assertNotEmpty($batch->errors);
    $this->assertStringContainsString('fora dos limites permitidos', json_encode($batch->errors));
})->group('SPECSFY:AC-002');

it('deletion blocked for batch with authorized invoices', function () {
    $this->withoutExceptionHandling();
    
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $user->companies()->attach($company->id);

    $this->actingAs($user);

    $batch = InvoiceBatch::create(['company_id' => $company->id, 'total_records' => 1]);
    $customer = \App\Models\Customer::factory()->create(['company_id' => $company->id]);
    
    Invoice::create([
        'company_id' => $company->id,
        'batch_id' => $batch->id,
        'customer_id' => $customer->id,
        'status' => InvoiceStatus::AUTHORIZED->value,
        'service_amount' => 100
    ]);

    $this->expectException(BatchDeletionBlockedException::class);

    $this->withHeaders([
        'X-Impersonate-Company-Id' => $company->id
    ])->deleteJson("/api/batches/{$batch->id}");
})->group('SPECSFY:AC-003');

it('deletion allowed for batch with draft invoices', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();
    $user->companies()->attach($company->id);

    $this->actingAs($user);

    $batch = InvoiceBatch::create(['company_id' => $company->id, 'total_records' => 1]);
    $customer = \App\Models\Customer::factory()->create(['company_id' => $company->id]);
    
    Invoice::create([
        'company_id' => $company->id,
        'batch_id' => $batch->id,
        'customer_id' => $customer->id,
        'status' => InvoiceStatus::DRAFT->value,
        'service_amount' => 100
    ]);

    $response = $this->withHeaders([
        'X-Impersonate-Company-Id' => $company->id
    ])->deleteJson("/api/batches/{$batch->id}");

    $response->assertStatus(200);
    
    $this->assertDatabaseMissing('invoice_batches', ['id' => $batch->id]);
    $this->assertDatabaseMissing('invoices', ['batch_id' => $batch->id, 'deleted_at' => null]);
})->group('SPECSFY:AC-003');
