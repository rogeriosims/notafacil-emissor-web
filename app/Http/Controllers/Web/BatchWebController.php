<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Models\InvoiceBatch;
use App\Services\ImpersonationManager;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class BatchWebController extends Controller
{
    public function __construct(
        private readonly ImpersonationManager $impersonationManager
    ) {}

    public function index(): Response
    {
        $companyId = $this->impersonationManager->getActiveCompanyId();

        $query = InvoiceBatch::query();
        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        $batches = $query->latest('id')->paginate(15);

        $batches->getCollection()->transform(function ($batch) {
            return [
                'id' => $batch->id,
                'file_name' => $batch->file_name ?? "Lote #{$batch->id}",
                'total_rows' => $batch->total_rows ?? 0,
                'processed_rows' => $batch->processed_rows ?? 0,
                'success_count' => $batch->success_count ?? 0,
                'error_count' => $batch->error_count ?? 0,
                'status' => $batch->status instanceof \BackedEnum ? $batch->status->value : (string) $batch->status,
                'created_at' => $batch->created_at?->format('d/m/Y H:i') ?? '-',
            ];
        });

        return Inertia::render('Batches/Index', [
            'batches' => $batches,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Batches/Create');
    }
}
