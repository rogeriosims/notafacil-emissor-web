<?php

declare(strict_types=1);

use App\Enums\InvoiceStatus;
use App\Models\Company;
use App\Models\Invoice;
use App\Models\User;
use App\Jobs\IssueInvoiceJob;
use App\Jobs\CheckInvoiceStatusJob;
use App\Infrastructure\Fiscal\Adapters\MockFiscalAdapter;
use App\Services\ImpersonationManager;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    $this->company = Company::factory()->create([
        'fiscal_driver' => 'mock'
    ]);
    
    $this->user = User::factory()->create();
    $this->user->companies()->attach($this->company->id);
    
    $this->actingAs($this->user);
    app(ImpersonationManager::class)->impersonate($this->company->id);

    $this->invoice = Invoice::factory()->create([
        'company_id' => $this->company->id,
        'status' => InvoiceStatus::DRAFT,
        'service_amount' => 100.00,
        'deductions_amount' => 0,
        'net_amount' => 100.00,
    ]);
});

test('issue invoice transitions status, requests provider and saves payload (SPECSFY: AC-001)', function () {
    Queue::fake([CheckInvoiceStatusJob::class]);

    $response = $this->withHeaders(['X-Impersonate-Company-Id' => $this->company->id])
        ->postJson("/api/invoices/{$this->invoice->id}/issue");

    $response->assertStatus(200);
    $response->assertJsonPath('status', 'AUTHORIZED');
    $response->assertJsonPath('tracking_id', 'MOCK-12345');

    $this->invoice->refresh();
    expect($this->invoice->status)->toBe(InvoiceStatus::AUTHORIZED);
    expect($this->invoice->tracking_id)->toBe('MOCK-12345');
    
    $payloads = $this->invoice->payloads;
    expect($payloads)->toHaveCount(1);
    expect($payloads->first()->endpoint)->toBe('issue');
    expect($payloads->first()->http_status)->toBe(200);
});

test('issue invoice reconciliation avoids duplication if processing (SPECSFY: AC-002)', function () {
    Queue::fake([CheckInvoiceStatusJob::class]);

    $this->invoice->update([
        'status' => InvoiceStatus::PROCESSING,
        'tracking_id' => 'MOCK-12345'
    ]);

    $response = $this->withHeaders(['X-Impersonate-Company-Id' => $this->company->id])
        ->postJson("/api/invoices/{$this->invoice->id}/issue");

    $response->assertStatus(200);
    $response->assertJsonPath('status', 'AUTHORIZED');
    
    $this->invoice->refresh();
    expect($this->invoice->status)->toBe(InvoiceStatus::AUTHORIZED);
    // Since MockFiscalAdapter checkStatus returns AUTHORIZED, the job transitions the invoice to AUTHORIZED directly without dispatching to issue() again.
});

test('polling job checks status and reschedules if needed (SPECSFY: AC-003)', function () {
    Queue::fake();

    $this->invoice->update([
        'status' => InvoiceStatus::PROCESSING,
        'tracking_id' => 'MOCK-12345'
    ]);

    $job = new CheckInvoiceStatusJob($this->invoice->id);
    
    // In our MockFiscalAdapter, checkStatus returns AUTHORIZED.
    $fiscalManager = app(\App\Infrastructure\Fiscal\FiscalManager::class);
    $job->handle($fiscalManager);

    $this->invoice->refresh();
    expect($this->invoice->status)->toBe(InvoiceStatus::AUTHORIZED);
});

test('cancel authorized invoice with valid reason updates status and audits (SPECSFY: AC-004)', function () {
    $this->invoice->update([
        'status' => InvoiceStatus::AUTHORIZED,
        'tracking_id' => 'MOCK-12345'
    ]);

    $reason = 'Motivo de cancelamento válido com 15 chars';
    $response = $this->withHeaders(['X-Impersonate-Company-Id' => $this->company->id])
        ->postJson("/api/invoices/{$this->invoice->id}/cancel", [
            'cancellation_reason' => $reason
        ]);

    $response->assertStatus(200);
    $response->assertJsonPath('status', 'CANCELED');

    $this->invoice->refresh();
    expect($this->invoice->status)->toBe(InvoiceStatus::CANCELED);
    expect($this->invoice->cancellation_reason)->toBe($reason);
    expect($this->invoice->cancelled_at)->not->toBeNull();
    
    $payloads = $this->invoice->payloads;
    expect($payloads)->toHaveCount(1);
    expect($payloads->first()->endpoint)->toBe('cancel');
});

test('cancel authorized invoice with short reason fails validation (SPECSFY: AC-004)', function () {
    $this->invoice->update([
        'status' => InvoiceStatus::AUTHORIZED,
        'tracking_id' => 'MOCK-12345'
    ]);

    $response = $this->withHeaders(['X-Impersonate-Company-Id' => $this->company->id])
        ->postJson("/api/invoices/{$this->invoice->id}/cancel", [
            'cancellation_reason' => 'Curto' // Less than 15 chars
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('cancellation_reason');
});