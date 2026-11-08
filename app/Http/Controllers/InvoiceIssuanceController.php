<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Enums\InvoiceStatus;
use App\Jobs\IssueInvoiceJob;
use App\Infrastructure\Fiscal\FiscalManager;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class InvoiceIssuanceController extends \Illuminate\Routing\Controller
{
    public function issue(Request $request, Invoice $invoice): JsonResponse
    {
        IssueInvoiceJob::dispatch($invoice->id);
        
        $invoice = $invoice->fresh();
        
        return response()->json([
            'status' => $invoice->status->value,
            'tracking_id' => $invoice->tracking_id,
        ]);
    }

    public function status(Invoice $invoice): JsonResponse
    {
        return response()->json([
            'status' => $invoice->status->value,
            'tracking_id' => $invoice->tracking_id,
        ]);
    }

    public function cancel(Request $request, Invoice $invoice, FiscalManager $fiscalManager): JsonResponse
    {
        $request->validate([
            'cancellation_reason' => 'required|string|min:15',
        ]);

        if ($invoice->status !== InvoiceStatus::AUTHORIZED) {
            return response()->json(['message' => 'Invoice must be authorized to be cancelled.'], 422);
        }

        $reason = $request->input('cancellation_reason');
        $driver = $fiscalManager->driver($invoice->company->fiscal_driver);
        
        $result = $driver->cancel($invoice->tracking_id ?? '', $reason);

        $invoice->payloads()->create([
            'request_payload' => ['tracking_id' => $invoice->tracking_id, 'reason' => $reason],
            'response_payload' => (array) $result,
            'http_status' => 200,
            'endpoint' => 'cancel'
        ]);

        if ($result->status === 'CANCELED') {
            $invoice->update([
                'status' => InvoiceStatus::CANCELED,
                'cancellation_reason' => $reason,
                'cancelled_at' => now(),
            ]);
        }

        return response()->json([
            'status' => $invoice->status->value,
        ]);
    }
}