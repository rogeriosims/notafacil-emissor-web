<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Models\Company;
use App\Models\Invoice;
use App\Services\ImpersonationManager;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly ImpersonationManager $impersonationManager
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $companyId = $this->impersonationManager->getActiveCompanyId();
        $startOfMonth = Carbon::now()->startOfMonth();

        $query = Invoice::query();
        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        // Métricas reais do mês
        $totalRevenueMonth = (float) (clone $query)
            ->where('status', 'AUTORIZADA')
            ->where('created_at', '>=', $startOfMonth)
            ->sum('service_amount');

        $authorizedCount = (clone $query)
            ->where('status', 'AUTORIZADA')
            ->count();

        $processingCount = (clone $query)
            ->whereIn('status', ['PROCESSING', 'DRAFT'])
            ->count();

        $errorCount = (clone $query)
            ->whereIn('status', ['ERROR', 'REJECTED'])
            ->count();

        // Últimas 5 notas
        $recentInvoices = (clone $query)
            ->latest('id')
            ->take(5)
            ->get()
            ->map(function ($inv) {
                $borrower = $inv->borrower_snapshot ?? [];
                return [
                    'id' => $inv->id,
                    'number' => $inv->number,
                    'borrower_name' => $borrower['name'] ?? 'Não informado',
                    'borrower_document' => $borrower['tax_id'] ?? '',
                    'service_amount' => number_format((float) $inv->service_amount, 2, ',', '.'),
                    'status' => $inv->status instanceof \BackedEnum ? $inv->status->value : (string) $inv->status,
                    'created_at' => $inv->created_at?->format('d/m H:i') ?? '-',
                ];
            });

        // Métricas de escritório (se aplicável)
        $officeData = null;
        if ($user->role === 'admin_escritorio' && $user->office_id) {
            $officeData = [
                'companies_count' => Company::where('office_id', $user->office_id)->count(),
            ];
        }

        return Inertia::render('Dashboard/Index', [
            'metrics' => [
                'revenue_month' => number_format($totalRevenueMonth, 2, ',', '.'),
                'authorized_count' => $authorizedCount,
                'processing_count' => $processingCount,
                'error_count' => $errorCount,
            ],
            'recent_invoices' => $recentInvoices,
            'office_data' => $officeData,
        ]);
    }
}
