<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\InvoiceWebController;
use App\Http\Controllers\Web\BatchWebController;
use App\Http\Controllers\Web\ScheduleWebController;
use App\Http\Controllers\Web\CompanySettingsController;
use App\Http\Controllers\Web\BorrowerWebController;
use App\Http\Controllers\Web\ServiceItemWebController;
use App\Http\Controllers\Web\ServiceCodeWebController;
use App\Http\Controllers\Web\OfficeWebController;
use App\Http\Controllers\Web\CompanyWebController;
use App\Http\Middleware\EnsureTenantContext;

Route::get('/', function () {
    return Auth::check() ? redirect()->route('dashboard') : redirect()->route('login');
});

Route::get('/login', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }
    return view('auth.login');
})->name('login');

Route::post('/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => ['required', 'email'],
        'password' => ['required'],
    ]);

    if (Auth::attempt($credentials)) {
        $request->session()->regenerate();
        return redirect()->intended('/dashboard');
    }

    return back()->withErrors(['email' => 'As credenciais informadas não conferem.']);
});

Route::post('/logout', function (Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return redirect()->route('login');
})->name('logout');

Route::middleware(['auth', EnsureTenantContext::class])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Notas Fiscais
    Route::get('/invoices', [InvoiceWebController::class, 'index'])->name('invoices.index');
    Route::get('/invoices/create', [InvoiceWebController::class, 'create'])->name('invoices.create');
    Route::post('/invoices', [InvoiceWebController::class, 'store'])->name('invoices.store');
    Route::get('/invoices/{id}', [InvoiceWebController::class, 'show'])->name('invoices.show');
    
    // Tomadores / Clientes
    Route::get('/borrowers', [BorrowerWebController::class, 'index'])->name('borrowers.index');
    Route::get('/borrowers/create', [BorrowerWebController::class, 'create'])->name('borrowers.create');
    Route::post('/borrowers', [BorrowerWebController::class, 'store'])->name('borrowers.store');

    // Catálogo de Serviços da Empresa
    Route::get('/services', [ServiceItemWebController::class, 'index'])->name('services.index');
    Route::get('/services/create', [ServiceItemWebController::class, 'create'])->name('services.create');
    Route::post('/services', [ServiceItemWebController::class, 'store'])->name('services.store');

    // Lotes e Agendamentos
    Route::get('/batches', [BatchWebController::class, 'index'])->name('batches.index');
    Route::get('/batches/create', [BatchWebController::class, 'create'])->name('batches.create');
    Route::get('/schedules', [ScheduleWebController::class, 'index'])->name('schedules.index');

    // Configurações e Certificado
    Route::get('/companies/settings', [CompanySettingsController::class, 'index'])->name('companies.settings');
    Route::post('/companies/settings', [CompanySettingsController::class, 'update'])->name('companies.settings.update');

    // Módulo de Gestão (Super Admin / Escritório)
    Route::get('/management/service-codes', [ServiceCodeWebController::class, 'index'])->name('management.service-codes.index');
    Route::get('/management/offices', [OfficeWebController::class, 'index'])->name('management.offices.index');
    Route::get('/management/offices/create', [OfficeWebController::class, 'create'])->name('management.offices.create');
    Route::post('/management/offices', [OfficeWebController::class, 'store'])->name('management.offices.store');
    Route::get('/management/companies', [CompanyWebController::class, 'index'])->name('management.companies.index');
    Route::get('/management/companies/create', [CompanyWebController::class, 'create'])->name('management.companies.create');
    Route::post('/management/companies', [CompanyWebController::class, 'store'])->name('management.companies.store');
});
