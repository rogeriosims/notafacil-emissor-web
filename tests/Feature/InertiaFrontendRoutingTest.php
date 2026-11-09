<?php

declare(strict_types=1);

use App\Models\User;
use App\Models\Office;
use App\Models\Company;
use App\Models\Invoice;
use Inertia\Testing\AssertableInertia as Assert;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->office = Office::factory()->create();
    $this->company = Company::factory()->create([
        'office_id' => $this->office->id,
    ]);
    
    $this->user = User::factory()->create([
        'office_id' => $this->office->id,
    ]);
    
    $this->user->companies()->attach($this->company->id);
});

// SPECSFY: AC-001
it('renders the dashboard with correct inertia component and props', function () {
    app(\App\Services\ImpersonationManager::class)->impersonate($this->company->id);

    $response = $this->actingAs($this->user)
        ->withHeader('X-Impersonate-Company-Id', $this->company->id)
        ->get('/dashboard');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Dashboard/Index')
        ->has('auth.user')
        ->has('active_company_id')
        ->where('active_company_id', $this->company->id)
    );
});

// SPECSFY: AC-002
it('renders the invoice create page', function () {
    $response = $this->actingAs($this->user)
        ->withHeader('X-Impersonate-Company-Id', $this->company->id)
        ->get('/invoices/create');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Invoices/Create')
    );
});

// SPECSFY: AC-003
it('renders the invoices index page', function () {
    $response = $this->actingAs($this->user)
        ->withHeader('X-Impersonate-Company-Id', $this->company->id)
        ->get('/invoices');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Invoices/Index')
    );
});

// SPECSFY: AC-004
it('renders the batches create page', function () {
    $response = $this->actingAs($this->user)
        ->withHeader('X-Impersonate-Company-Id', $this->company->id)
        ->get('/batches/create');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Batches/Create')
    );
});

it('renders the batches index page', function () {
    $response = $this->actingAs($this->user)
        ->withHeader('X-Impersonate-Company-Id', $this->company->id)
        ->get('/batches');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Batches/Index')
    );
});

it('renders the schedules index page', function () {
    $response = $this->actingAs($this->user)
        ->withHeader('X-Impersonate-Company-Id', $this->company->id)
        ->get('/schedules');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Schedules/Index')
    );
});

it('renders the invoice show page', function () {
    $invoice = Invoice::factory()->create([
        'company_id' => $this->company->id,
    ]);

    $response = $this->actingAs($this->user)
        ->withHeader('X-Impersonate-Company-Id', $this->company->id)
        ->get("/invoices/{$invoice->id}");

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Invoices/Show')
        ->has('invoice')
    );
});
