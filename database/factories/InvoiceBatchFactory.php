<?php
declare(strict_types=1);

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Company;
use App\Enums\BatchStatus;

class InvoiceBatchFactory extends Factory
{
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'total_records' => $this->faker->numberBetween(1, 100),
            'processed_records' => 0,
            'error_records' => 0,
            'status' => BatchStatus::PENDING,
            'errors' => null,
        ];
    }
}
