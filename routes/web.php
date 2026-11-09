<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\InvoiceWebController;
use App\Http\Controllers\Web\BatchWebController;
use App\Http\Controllers\Web\ScheduleWebController;
use App\Http\Controllers\Web\CompanySettingsController;
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
    
    Route::get('/invoices', [InvoiceWebController::class, 'index'])->name('invoices.index');
    Route::get('/invoices/create', [InvoiceWebController::class, 'create'])->name('invoices.create');
    Route::post('/invoices', [InvoiceWebController::class, 'store'])->name('invoices.store');
    Route::get('/invoices/{id}', [InvoiceWebController::class, 'show'])->name('invoices.show');
    
    Route::get('/batches', [BatchWebController::class, 'index'])->name('batches.index');
    Route::get('/batches/create', [BatchWebController::class, 'create'])->name('batches.create');
    
    Route::get('/schedules', [ScheduleWebController::class, 'index'])->name('schedules.index');

    Route::get('/companies/settings', [CompanySettingsController::class, 'index'])->name('companies.settings');
    Route::post('/companies/settings', [CompanySettingsController::class, 'update'])->name('companies.settings.update');
});
