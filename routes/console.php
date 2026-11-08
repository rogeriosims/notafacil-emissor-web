<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Console\Commands\ImportLegacySupabaseCommand;
use App\Console\Commands\VerifyCutoverIntegrityCommand;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('schedules:process')->daily();

Artisan::command('fiscalflow:import-legacy-supabase {file} {--chunk=100}', function ($file, $chunk) {
    return $this->call(ImportLegacySupabaseCommand::class, ['file' => $file, '--chunk' => $chunk]);
})->purpose('Imports legacy data from Supabase JSON file with idempotency and chunking');

Artisan::command('fiscalflow:verify-cutover', function () {
    return $this->call(VerifyCutoverIntegrityCommand::class);
})->purpose('Verifies post-cutover data integrity such as constraints, valid status, and snapshot fields');

