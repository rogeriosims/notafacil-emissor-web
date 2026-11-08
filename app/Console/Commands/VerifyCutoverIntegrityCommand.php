<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class VerifyCutoverIntegrityCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fiscalflow:verify-cutover';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verifies post-cutover data integrity such as constraints, valid status, and snapshot fields';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Starting cutover integrity verification...");

        $totalInvoices = DB::table('invoices')->count();
        $this->info("Total invoices: {$totalInvoices}");

        if ($totalInvoices === 0) {
            $this->warn("No invoices found to verify.");
            return Command::SUCCESS;
        }

        $validStatuses = ['DRAFT', 'AUTHORIZED', 'CANCELLED'];
        
        $invalidStatusCount = DB::table('invoices')
            ->whereNotIn('status', $validStatuses)
            ->orWhereNull('status')
            ->count();

        $missingBorrowerSnapshotCount = DB::table('invoices')
            ->whereNull('borrower_snapshot')
            ->count();

        $missingIssSnapshotCount = DB::table('invoices')
            ->whereNull('iss_snapshot')
            ->count();

        $orphanedInvoicesCount = DB::table('invoices')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                      ->from('companies')
                      ->whereColumn('companies.id', 'invoices.company_id');
            })
            ->count();
        
        $errors = [];

        if ($invalidStatusCount > 0) {
            $errors[] = "Found {$invalidStatusCount} invoices with undefined or invalid status.";
        }

        if ($missingBorrowerSnapshotCount > 0) {
            $errors[] = "Found {$missingBorrowerSnapshotCount} invoices missing borrower_snapshot.";
        }

        if ($missingIssSnapshotCount > 0) {
            $errors[] = "Found {$missingIssSnapshotCount} invoices missing iss_snapshot.";
        }

        if ($orphanedInvoicesCount > 0) {
            $errors[] = "Found {$orphanedInvoicesCount} orphaned invoices without a valid company.";
        }

        if (count($errors) > 0) {
            $this->error("Cutover integrity check failed with the following errors:");
            foreach ($errors as $error) {
                $this->error("- {$error}");
            }
            return 1;
        }

        $this->info("Cutover integrity verification completed successfully. All checks passed.");
        return Command::SUCCESS;
    }
}
