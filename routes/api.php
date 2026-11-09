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

        $request->validate([
            'certificate' => ['required', 'file', 'max:5120'],
            'password' => ['required', 'string'],
        ]);

        $file = $request->file('certificate');
        $password = $request->input('password');
        $content = file_get_contents($file->getRealPath());

        $certs = [];
        if (!openssl_pkcs12_read($content, $certs, $password)) {
            return response()->json([
                'message' => 'Senha incorreta ou arquivo PFX/P12 corrompido/inválido.',
            ], 422);
        }

        $x509 = openssl_x509_parse($certs['cert']);
        $expiresAt = isset($x509['validTo_time_t']) ? \Carbon\Carbon::createFromTimestamp($x509['validTo_time_t']) : null;
        $issuerInfo = json_encode([
            'subject' => $x509['subject'] ?? [],
            'issuer' => $x509['issuer'] ?? [],
            'valid_from' => isset($x509['validFrom_time_t']) ? date('c', $x509['validFrom_time_t']) : null,
            'valid_to' => isset($x509['validTo_time_t']) ? date('c', $x509['validTo_time_t']) : null,
        ]);

        $certificate = \App\Models\Certificate::updateOrCreate(
            ['company_id' => $company->id],
            [
                'pfx_encrypted' => base64_encode($content),
                'password_encrypted' => $password,
                'expires_at' => $expiresAt,
                'issuer_info' => $issuerInfo,
            ]
        );

        return response()->json([
            'message' => 'Certificado Digital A1 validado e instalado com sucesso.',
            'certificate' => [
                'id' => $certificate->id,
                'expires_at' => $certificate->expires_at?->format('d/m/Y H:i'),
                'is_valid' => $certificate->expires_at ? $certificate->expires_at->isFuture() : false,
            ]
        ]);
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
