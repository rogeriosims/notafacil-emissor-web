<?php
declare(strict_types=1);

use App\Models\Company;
use App\Models\Customer;
use App\Models\ServiceItem;
use App\Models\Invoice;
use App\Models\InvoiceBatch;
use App\Models\InvoiceSchedule;
use App\Models\Office;
use App\Models\User;
use App\Enums\InvoiceStatus;
use App\Enums\BatchStatus;
use App\Enums\ScheduleStatus;
use App\Enums\ScheduleType;
use Illuminate\Support\Facades\DB;
use App\Services\ImpersonationManager;

beforeEach(function () {
    $this->office = Office::factory()->create();
    $this->company1 = Company::factory()->create(['office_id' => $this->office->id]);
    $this->company2 = Company::factory()->create(['office_id' => $this->office->id]);

    $this->user = User::factory()->create([
        'office_id' => $this->office->id,
        'role' => 'COMPANY_USER',
    ]);

    DB::table('company_user')->insert([
        ['company_id' => $this->company1->id, 'user_id' => $this->user->id],
        ['company_id' => $this->company2->id, 'user_id' => $this->user->id],
    ]);

    $this->actingAs($this->user);
});

test('SPECSFY: AC-001 - Tomador cadastrado com sucesso sob o tenant da empresa', function () {
    app(ImpersonationManager::class)->impersonate($this->company1->id);

    $customer = Customer::factory()->create([
        'company_id' => $this->company1->id,
        'tax_id' => '12.345.678/0001-90',
        'iss_withheld' => true,
    ]);

    expect($customer->company_id)->toBe($this->company1->id)
        ->and(Customer::count())->toBe(1);

    // switch to company2 and expect no customer
    app(ImpersonationManager::class)->impersonate($this->company2->id);
    expect(Customer::count())->toBe(0);
});

test('SPECSFY: AC-001 - Catálogo de serviço municipal cadastrado', function () {
    app(ImpersonationManager::class)->impersonate($this->company1->id);

    $serviceItem = ServiceItem::factory()->create([
        'company_id' => $this->company1->id,
        'service_code' => '01.07',
        'default_rate' => 3.5,
    ]);

    expect($serviceItem->company_id)->toBe($this->company1->id)
        ->and($serviceItem->service_code)->toBe('01.07')
        ->and((float) $serviceItem->default_rate)->toBe(3.5);
});

test('SPECSFY: AC-002 - Criação de nota fiscal em rascunho com cálculos congelados', function () {
    app(ImpersonationManager::class)->impersonate($this->company1->id);

    $customer = Customer::factory()->create([
        'company_id' => $this->company1->id,
    ]);
    $serviceItem = ServiceItem::factory()->create([
        'company_id' => $this->company1->id,
    ]);

    $invoice = Invoice::factory()->create([
        'company_id' => $this->company1->id,
        'customer_id' => $customer->id,
        'status' => InvoiceStatus::DRAFT,
        'borrower_snapshot' => ['name' => $customer->name, 'tax_id' => $customer->tax_id],
        'iss_snapshot' => ['rate' => $serviceItem->default_rate, 'amount' => 100],
        'net_amount' => 100,
    ]);

    expect($invoice->borrower_snapshot)->toBeArray()
        ->and($invoice->borrower_snapshot['tax_id'])->toBe($customer->tax_id)
        ->and($invoice->iss_snapshot)->toBeArray();
});

test('SPECSFY: AC-002 - Bloqueio de exclusão direta de nota autorizada', function () {
    app(ImpersonationManager::class)->impersonate($this->company1->id);

    $invoice = Invoice::factory()->create([
        'company_id' => $this->company1->id,
        'status' => InvoiceStatus::AUTHORIZED,
    ]);

    $this->expectException(\Illuminate\Database\QueryException::class);
    // Assuming some DB restrict or trigger, or application logic. If logic, it's not implemented yet.
    // For now we assume we try to delete it directly. A soft delete could be used.
    // We will use SoftDeletes for Invoice as specified "deve-se utilizar SoftDeletes"

    // Wait, the spec says "deve-se utilizar SoftDeletes ou restrição RESTRICT de integridade referencial".
    // Usually eloquent soft deletes bypass DB restrict if not DB level.
    // Actually the BDD says "bloquear a operação garantindo a integridade dos livros fiscais".
    // We will implement an Observer or override delete method in Invoice model to prevent deletion if AUTHORIZED.
    $invoice->delete();
});

test('SPECSFY: AC-003 - Criação de agendamento recorrente mensal', function () {
    app(ImpersonationManager::class)->impersonate($this->company1->id);

    $templateInvoice = Invoice::factory()->create([
        'company_id' => $this->company1->id,
        'status' => InvoiceStatus::DRAFT
    ]);

    $schedule = InvoiceSchedule::factory()->create([
        'company_id' => $this->company1->id,
        'template_invoice_id' => $templateInvoice->id,
        'type' => ScheduleType::MONTHLY,
        'day_of_month' => 10,
        'status' => ScheduleStatus::ACTIVE,
    ]);

    expect($schedule->status)->toBe(ScheduleStatus::ACTIVE)
        ->and($schedule->type)->toBe(ScheduleType::MONTHLY)
        ->and($schedule->template_invoice_id)->toBe($templateInvoice->id);
});

test('SPECSFY: AC-003 - Criação de lote de importação com contadores', function () {
    app(ImpersonationManager::class)->impersonate($this->company1->id);

    $batch = InvoiceBatch::factory()->create([
        'company_id' => $this->company1->id,
        'total_records' => 50,
        'status' => BatchStatus::PENDING,
    ]);

    expect($batch->total_records)->toBe(50)
        ->and($batch->status)->toBe(BatchStatus::PENDING);
});
