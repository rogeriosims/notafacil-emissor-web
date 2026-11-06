<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Services\ImpersonationManager;
use App\Http\Middleware\EnsureTenantContext;

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
