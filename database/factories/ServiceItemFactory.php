<?php
declare(strict_types=1);

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Company;

class ServiceItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'service_code' => $this->faker->numerify('##.##'),
            'cnae_code' => $this->faker->numerify('#######'),
            'description' => $this->faker->sentence(),
            'default_rate' => $this->faker->randomFloat(2, 2, 5),
            'allow_retention' => $this->faker->boolean(),
        ];
    }
}
