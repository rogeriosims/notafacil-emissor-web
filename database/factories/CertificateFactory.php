<?php
declare(strict_types=1);

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Company;

class CertificateFactory extends Factory
{
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'pfx_encrypted' => 'encrypted_data',
            'password_encrypted' => 'encrypted_password',
            'expires_at' => now()->addYear(),
            'issuer_info' => 'Issuer Name',
        ];
    }
}
