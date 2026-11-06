<?php
declare(strict_types=1);

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Company;
use App\Models\Office;
use App\Models\Customer;
use App\Enums\InvoiceStatus;

class InvoiceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'issuing_office_id' => Office::factory(),
            'customer_id' => Customer::factory(),
            'batch_id' => null,
            'schedule_id' => null,
            'status' => InvoiceStatus::DRAFT,
            'number' => null,
            'series' => '1',
            'dps_id' => null,
            'issue_date' => now(),
            'competence_date' => now()->format('Y-m-d'),
            'service_amount' => $this->faker->randomFloat(2, 100, 1000),
            'deductions_amount' => 0,
            'net_amount' => $this->faker->randomFloat(2, 100, 1000),
            'borrower_snapshot' => null,
            'iss_snapshot' => null,
            'federal_taxes_snapshot' => null,
            'xml_url' => null,
            'pdf_url' => null,
        ];
    }
}
