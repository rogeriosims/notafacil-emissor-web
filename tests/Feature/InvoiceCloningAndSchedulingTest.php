<?php
declare(strict_types=1);

use App\Models\Company;
use App\Models\Invoice;
use App\Models\InvoiceSchedule;
use App\Models\ScheduleExecutionLog;
use App\Models\User;
use App\Enums\InvoiceStatus;
use App\Enums\ScheduleStatus;
use App\Enums\ScheduleType;
use Illuminate\Support\Carbon;
use App\Services\ImpersonationManager;
use Illuminate\Support\Facades\Artisan;
use function Pest\Laravel\postJson;
use function Pest\Laravel\actingAs;

/**
 * SPECSFY: AC-001, US-001, US-002, US-003, FR-001, FR-002, NFR-001, NFR-002
 */
it('duplicates an authorized invoice successfully to draft', function () {
    $company = Company::factory()->create();
    $user = User::factory()->create();
    $user->companies()->attach($company->id);

    app(ImpersonationManager::class)->impersonate($company->id);

    $invoice = Invoice::factory()->create([
        'company_id' => $company->id,
        'status' => InvoiceStatus::AUTHORIZED,
        'number' => '000123',
        'dps_id' => 'abc-123',
        'service_amount' => 100.50,
        'issue_date' => Carbon::now()->subDays(5),
        'competence_date' => Carbon::now()->subDays(5)->format('Y-m-d'),
    ]);

    actingAs($user);
    $response = postJson("/api/invoices/{$invoice->id}/duplicate", [], [
        'X-Impersonate-Company-Id' => $company->id
    ]);

    $response->assertStatus(201);
    
    $clonedInvoiceId = $response->json('id');
    $clonedInvoice = Invoice::find($clonedInvoiceId);

    expect($clonedInvoice->status)->toBe(InvoiceStatus::DRAFT)
        ->and($clonedInvoice->number)->toBeNull()
        ->and($clonedInvoice->dps_id)->toBeNull()
        ->and((float) $clonedInvoice->service_amount)->toBe(100.50)
        ->and($clonedInvoice->issue_date->isToday())->toBeTrue()
        ->and($clonedInvoice->competence_date->isToday())->toBeTrue();
});

/**
 * SPECSFY: AC-001
 */
it('forbids duplicating an invoice from another company', function () {
    $company1 = Company::factory()->create();
    $company2 = Company::factory()->create();
    
    $user = User::factory()->create();
    $user->companies()->attach($company1->id);

    app(ImpersonationManager::class)->impersonate($company1->id);

    // Invoice from company2
    $invoice = Invoice::factory()->create([
        'company_id' => $company2->id,
        'status' => InvoiceStatus::AUTHORIZED,
    ]);

    actingAs($user);
    $response = postJson("/api/invoices/{$invoice->id}/duplicate", [], [
        'X-Impersonate-Company-Id' => $company1->id
    ]);

    $response->assertStatus(404);
});

/**
 * SPECSFY: AC-002, US-001, US-002, US-003, FR-001, FR-002, NFR-001, NFR-002
 */
it('resolves dynamic placeholders in schedule description', function () {
    $company = Company::factory()->create();
    app(ImpersonationManager::class)->impersonate($company->id);

    $scheduleService = app(\App\Services\InvoiceScheduleService::class);
    
    Carbon::setTestNow('2026-11-15'); // Novembro de 2026

    $description1 = "Mensalidade escolar - {{mes_anterior}} de {{ano}}";
    $resolved1 = $scheduleService->resolveDescription($description1, Carbon::now());
    expect($resolved1)->toBe("Mensalidade escolar - Outubro de 2026");

    $description2 = "Serviço {{variavel_invalida}}";
    $resolved2 = $scheduleService->resolveDescription($description2, Carbon::now());
    expect($resolved2)->toBe("Serviço {{variavel_invalida}}");
    
    $description3 = "Competência {{competencia_formatada}}";
    $resolved3 = $scheduleService->resolveDescription($description3, Carbon::now());
    expect($resolved3)->toBe("Competência 11/2026");
    
    $description4 = "Mês atual {{mes}}";
    $resolved4 = $scheduleService->resolveDescription($description4, Carbon::now());
    expect($resolved4)->toBe("Mês atual Novembro");
});

/**
 * SPECSFY: AC-003, US-001, US-002, US-003, FR-001, FR-002, NFR-001, NFR-002
 */
it('processes active schedules and calculates next date via artisan command', function () {
    $company = Company::factory()->create();
    
    $templateInvoice = Invoice::factory()->create([
        'company_id' => $company->id,
        'status' => InvoiceStatus::AUTHORIZED,
        'service_amount' => 500,
    ]);

    $schedule = InvoiceSchedule::factory()->create([
        'company_id' => $company->id,
        'template_invoice_id' => $templateInvoice->id,
        'type' => ScheduleType::MONTHLY,
        'day_of_month' => 15,
        'next_emission_date' => Carbon::today(),
        'status' => ScheduleStatus::ACTIVE,
        'description_template' => 'Ref {{mes}}'
    ]);

    Artisan::call('schedules:process');

    $schedule->refresh();
    
    // next emission date should be next month on the 15th
    $expectedNextDate = Carbon::today()->addMonth()->day(15);
    expect($schedule->next_emission_date->toDateString())->toBe($expectedNextDate->toDateString());

    // check execution log
    $log = ScheduleExecutionLog::where('schedule_id', $schedule->id)->first();
    expect($log)->not->toBeNull()
        ->and($log->status)->toBe('SUCCESS')
        ->and($log->invoice_id)->not->toBeNull();
        
    // check created invoice
    $newInvoice = Invoice::find($log->invoice_id);
    expect($newInvoice->status)->toBe(InvoiceStatus::DRAFT)
        ->and((float) $newInvoice->service_amount)->toBe(500.0);
        
    $scheduleService = app(\App\Services\InvoiceScheduleService::class);
    $expectedResolvedDescription = $scheduleService->resolveDescription('Ref {{mes}}', Carbon::today());
    expect($newInvoice->iss_snapshot['description'])->toBe($expectedResolvedDescription);
});

