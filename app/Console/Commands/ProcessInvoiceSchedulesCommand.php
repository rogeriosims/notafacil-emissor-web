<?php
declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\InvoiceSchedule;
use App\Models\ScheduleExecutionLog;
use App\Services\InvoiceCloningService;
use App\Services\InvoiceScheduleService;
use App\Enums\ScheduleStatus;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Throwable;

class ProcessInvoiceSchedulesCommand extends Command
{
    protected $signature = 'schedules:process';
    protected $description = 'Process recurrent invoice schedules that are due.';

    public function handle(InvoiceCloningService $cloningService, InvoiceScheduleService $scheduleService)
    {
        $today = Carbon::today();
        
        $schedules = InvoiceSchedule::with('templateInvoice')
            ->where('status', ScheduleStatus::ACTIVE)
            ->whereDate('next_emission_date', '<=', $today)
            ->get();

        foreach ($schedules as $schedule) {
            if (!$schedule->templateInvoice) {
                continue;
            }

            try {
                DB::transaction(function () use ($schedule, $cloningService, $scheduleService, $today) {
                    $clonedInvoice = $cloningService->clone($schedule->templateInvoice);
                    $clonedInvoice->schedule_id = $schedule->id;

                    if ($schedule->description_template) {
                        $resolvedDesc = $scheduleService->resolveDescription($schedule->description_template, $today);
                        
                        $snapshot = $clonedInvoice->iss_snapshot ?? [];
                        $snapshot['description'] = $resolvedDesc;
                        $clonedInvoice->iss_snapshot = $snapshot;
                    }

                    $clonedInvoice->save();

                    // Advance the schedule
                    $scheduleService->advanceNextEmissionDate($schedule);

                    // Create log
                    ScheduleExecutionLog::create([
                        'schedule_id' => $schedule->id,
                        'invoice_id' => $clonedInvoice->id,
                        'status' => 'SUCCESS',
                        'execution_date' => Carbon::now(),
                    ]);
                });
            } catch (Throwable $e) {
                ScheduleExecutionLog::create([
                    'schedule_id' => $schedule->id,
                    'status' => 'ERROR',
                    'details' => ['error' => $e->getMessage()],
                    'execution_date' => Carbon::now(),
                ]);
            }
        }

        return Command::SUCCESS;
    }
}
