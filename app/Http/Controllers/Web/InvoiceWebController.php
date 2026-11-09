<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Invoice;

class InvoiceWebController extends Controller
{
    public function index(): Response
    {
        // For testing purposes we render with empty pagination
        return Inertia::render('Invoices/Index', [
            'invoices' => [
                'data' => []
            ]
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Invoices/Create');
    }

    public function show(string $id): Response
    {
        $invoice = Invoice::findOrFail($id);

        return Inertia::render('Invoices/Show', [
            'invoice' => $invoice,
        ]);
    }
}