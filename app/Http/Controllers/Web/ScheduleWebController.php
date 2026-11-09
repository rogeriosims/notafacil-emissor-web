<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Models\InvoiceSchedule;
use App\Services\ImpersonationManager;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleWebController extends Controller
{
    public function __construct(
        private readonly ImpersonationManager $impersonationManager
    ) {}

    public function index(): Response
    {
        $companyId = $this->impersonationManager->getActiveCompanyId();

        $query = InvoiceSchedule::query();
        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        $schedules = $query->latest('id')->paginate(15);

        $schedules->getCollection()->transform(function ($schedule) {
            return [
                'id' => $schedule->id,
                'type' => $schedule->schedule_type ?? 'RECURRENT',
                'day_of_month' => $schedule->day_of_month ?? 1,
                'amount' => number_format((float) ($schedule->service_amount ?? 0), 2, ',', '.'),
                'status' => $schedule->status instanceof \BackedEnum ? $schedule->status->value : (string) $schedule->status,
                'description' => $schedule->service_description ?? '',
                'next_execution_at' => $schedule->next_execution_at?->format('d/m/Y') ?? '-',
            ];
        });

        return Inertia::render('Schedules/Index', [
            'schedules' => $schedules,
        ]);
    }
}
