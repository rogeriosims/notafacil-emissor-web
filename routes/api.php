<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Services\ImpersonationManager;
use App\Http\Middleware\EnsureTenantContext;
use App\Http\Controllers\Api\LookupController;
use App\Http\Controllers\Api\SimulationController;

// Consultas Agnósticas (CEP e CNPJ com prioridade ACBr e fallback)
Route::middleware(['auth', EnsureTenantContext::class])->group(function () {
    Route::get('/lookup/cnpj/{cnpj}', [LookupController::class, 'cnpj']);
    Route::get('/lookup/cep/{cep}', [LookupController::class, 'cep']);
    Route::post('/invoices/simulate', [SimulationController::class, 'simulate']);
});

Route::middleware(['auth', EnsureTenantContext::class])->group(function () {
    Route::get('/current-context', function (ImpersonationManager $manager) {
        return response()->json([
            'active_company_id' => $manager->getActiveCompanyId(),
        ]);
    });
});

Route::middleware(['auth', EnsureTenantContext::class])->group(function () {
    Route::post('/companies/{company}/certificate', function (Request $request, \App\Models\Company $company) {
        if ($request->user()->cannot('uploadCertificate', $company)) {
            abort(403);
        }

        return response()->json(['message' => 'Certificado salvo com sucesso.']);
    });
});

Route::middleware(['auth', EnsureTenantContext::class])->group(function () {
    Route::post('/set-impersonation', function (Request $request) {
        session(['impersonate_company_id' => $request->company_id]);
        return response()->json(['message' => 'Impersonation set.']);
    });

    Route::post('/exit-impersonation', function (Request $request) {
        session()->forget('impersonate_company_id');
        return response()->json(['message' => 'Impersonation removed.']);
    });
});

Route::middleware(['auth', EnsureTenantContext::class])->group(function () {
    Route::post('/invoices/{invoice}/duplicate', [\App\Http\Controllers\InvoiceCloningController::class, 'duplicate']);
    Route::post('/batches', [\App\Http\Controllers\BatchController::class, 'store']);
    Route::get('/batches', [\App\Http\Controllers\BatchController::class, 'index']);
    Route::get('/batches/{id}', [\App\Http\Controllers\BatchController::class, 'show']);
    Route::delete('/batches/{id}', [\App\Http\Controllers\BatchController::class, 'destroy']);
    
    Route::post('/invoices/{invoice}/issue', [\App\Http\Controllers\InvoiceIssuanceController::class, 'issue']);
    Route::get('/invoices/{invoice}/status', [\App\Http\Controllers\InvoiceIssuanceController::class, 'status']);
    Route::post('/invoices/{invoice}/cancel', [\App\Http\Controllers\InvoiceIssuanceController::class, 'cancel']);
});
