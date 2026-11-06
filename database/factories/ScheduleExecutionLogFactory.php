<?php
declare(strict_types=1);

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\InvoiceSchedule;

class ScheduleExecutionLogFactory extends Factory
{
    public function definition(): array
    {
        return [
            'schedule_id' => InvoiceSchedule::factory(),
            'invoice_id' => null, // Typically filled when log is related to an invoice
            'status' => 'SUCCESS',
            'details' => ['message' => 'Executed successfully'],
            'execution_date' => now(),
        ];
    }
}
