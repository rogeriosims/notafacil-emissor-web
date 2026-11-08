<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ImportLegacySupabaseCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fiscalflow:import-legacy-supabase {file} {--chunk=100}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Imports legacy data from Supabase JSON file with idempotency and chunking';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $filePath = $this->argument('file');
        $chunkSize = (int) $this->option('chunk');

        if (!file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return Command::FAILURE;
        }

        $data = json_decode(file_get_contents($filePath), true);

        if (!is_array($data)) {
            $this->error("Invalid JSON file");
            return Command::FAILURE;
        }

        $this->info("Starting import of " . count($data) . " records...");

        $chunks = array_chunk($data, $chunkSize);
        $imported = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($chunks as $index => $chunk) {
            $this->info("Processing chunk " . ($index + 1) . " of " . count($chunks));
            
            DB::beginTransaction();
            try {
                foreach ($chunk as $record) {
                    if (!isset($record['id']) || !isset($record['company_id'])) {
                        Log::warning("Skipping record without id or company_id: " . json_encode($record));
                        $skipped++;
                        continue;
                    }

                    $exists = DB::table('invoices')->where('id', $record['id'])->exists();
                    
                    if ($exists) {
                        $skipped++;
                        continue;
                    }

                    // Map legacy data to new schema
                    DB::table('invoices')->insert([
                        'id' => $record['id'],
                        'company_id' => $record['company_id'],
                        'status' => $record['status'] ?? 'DRAFT',
                        'number' => $record['number'] ?? null,
                        'series' => $record['series'] ?? null,
                        'service_amount' => $record['service_amount'] ?? null,
                        'net_amount' => $record['net_amount'] ?? null,
                        'borrower_snapshot' => isset($record['borrower_snapshot']) ? json_encode($record['borrower_snapshot']) : null,
                        'iss_snapshot' => isset($record['iss_snapshot']) ? json_encode($record['iss_snapshot']) : null,
                        'federal_taxes_snapshot' => isset($record['federal_taxes_snapshot']) ? json_encode($record['federal_taxes_snapshot']) : null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    $imported++;
                }
                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error("Error processing chunk " . ($index + 1) . ": " . $e->getMessage());
                $this->error("Error processing chunk " . ($index + 1) . ": " . $e->getMessage());
                $errors += count($chunk);
            }
        }

        $this->info("Import completed!");
        $this->table(
            ['Imported', 'Skipped (Duplicate/Invalid)', 'Errors'],
            [[$imported, $skipped, $errors]]
        );

        return Command::SUCCESS;
    }
}
