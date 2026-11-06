<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Office;
use Illuminate\Database\Eloquent\Factories\Factory;

class CompanyFactory extends Factory
{
    protected $model = Company::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->company(),
            'office_id' => Office::factory(),
            'allow_client_certificate_upload' => false,
        ];
    }
}
