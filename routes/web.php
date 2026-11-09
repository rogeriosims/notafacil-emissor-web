<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\InvoiceWebController;
use App\Http\Controllers\Web\BatchWebController;
use App\Http\Controllers\Web\ScheduleWebController;
use App\Http\Middleware\EnsureTenantContext;

Route::get('/', function () {
    return view('welcome');
});

Route::middleware(['auth', EnsureTenantContext::class])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    Route::get('/invoices', [InvoiceWebController::class, 'index'])->name('invoices.index');
    Route::get('/invoices/create', [InvoiceWebController::class, 'create'])->name('invoices.create');
    Route::get('/invoices/{id}', [InvoiceWebController::class, 'show'])->name('invoices.show');
    
    Route::get('/batches', [BatchWebController::class, 'index'])->name('batches.index');
    Route::get('/batches/create', [BatchWebController::class, 'create'])->name('batches.create');
    
    Route::get('/schedules', [ScheduleWebController::class, 'index'])->name('schedules.index');
});
