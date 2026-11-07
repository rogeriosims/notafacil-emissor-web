<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Services\InvoiceCloningService;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class InvoiceCloningController extends Controller
{
    public function duplicate(Invoice $invoice, InvoiceCloningService $cloningService): JsonResponse
    {
        $cloned = $cloningService->clone($invoice);
        
        return response()->json($cloned, 201);
    }
}
