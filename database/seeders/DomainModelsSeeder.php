<?php
declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Company;
use App\Models\Office;
use App\Models\Customer;
use App\Models\ServiceItem;
use App\Models\Invoice;
use App\Models\InvoiceBatch;
use App\Models\InvoiceSchedule;

class DomainModelsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $office = Office::factory()->create();
        $company = Company::factory()->create(['office_id' => $office->id]);

        $customers = Customer::factory(5)->create(['company_id' => $company->id]);
        $serviceItems = ServiceItem::factory(3)->create(['company_id' => $company->id]);

        $batch = InvoiceBatch::factory()->create(['company_id' => $company->id]);

        Invoice::factory(5)->create([
            'company_id' => $company->id,
            'issuing_office_id' => $office->id,
            'customer_id' => $customers->first()->id,
            'batch_id' => $batch->id,
        ]);

        $template = Invoice::factory()->create([
            'company_id' => $company->id,
            'issuing_office_id' => $office->id,
            'customer_id' => $customers->last()->id,
        ]);

        InvoiceSchedule::factory()->create([
            'company_id' => $company->id,
            'template_invoice_id' => $template->id,
        ]);
    }
}
