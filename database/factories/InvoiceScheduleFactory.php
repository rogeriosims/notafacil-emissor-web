<?php
declare(strict_types=1);

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Company;
use App\Models\Invoice;
use App\Enums\ScheduleStatus;
use App\Enums\ScheduleType;

class InvoiceScheduleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'template_invoice_id' => Invoice::factory(),
            'type' => ScheduleType::MONTHLY,
            'day_of_month' => $this->faker->numberBetween(1, 28),
            'next_emission_date' => now()->addMonth(),
            'status' => ScheduleStatus::ACTIVE,
            'description_template' => 'Fatura mensal de serviços - {month}/{year}',
        ];
    }
}
