<?php
declare(strict_types=1);

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Company;

class CustomerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'name' => $this->faker->company(),
            'tax_id' => $this->faker->numerify('##.###.###/0001-##'),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'street' => $this->faker->streetName(),
            'number' => $this->faker->buildingNumber(),
            'neighborhood' => $this->faker->citySuffix(),
            'city_code' => $this->faker->numerify('#######'),
            'state' => $this->faker->stateAbbr(),
            'zip_code' => $this->faker->postcode(),
            'iss_withheld' => false,
        ];
    }
}
