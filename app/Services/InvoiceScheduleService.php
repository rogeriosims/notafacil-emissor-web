<?php
declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Carbon;
use App\Models\InvoiceSchedule;

class InvoiceScheduleService
{
    /**
     * Resolves the description replacing placeholders
     */
    public function resolveDescription(string $template, Carbon $referenceDate): string
    {
        $originalLocale = \Carbon\Carbon::getLocale();
        \Carbon\Carbon::setLocale('pt_BR');

        $replacements = [
            '{{mes}}' => ucfirst($referenceDate->translatedFormat('F')),
            '{{mes_anterior}}' => ucfirst($referenceDate->copy()->subMonth()->translatedFormat('F')),
            '{{ano}}' => $referenceDate->format('Y'),
            '{{competencia_formatada}}' => $referenceDate->format('m/Y'),
        ];
        
        \Carbon\Carbon::setLocale($originalLocale);

        return str_replace(array_keys($replacements), array_values($replacements), $template);
    }
    
    /**
     * Advances the next emission date of a schedule based on its frequency.
     */
    public function advanceNextEmissionDate(InvoiceSchedule $schedule): void
    {
        if (!$schedule->next_emission_date) {
            return;
        }

        // For now, only MONTHLY type is defined in ScheduleType enum
        // If others are added (e.g., QUARTERLY), adjust here.
        if ($schedule->type->value === 'MONTHLY') {
            $nextDate = $schedule->next_emission_date->copy()->addMonth();
            
            if ($schedule->day_of_month) {
                // Ensure it sets to the correct day or the end of the month if invalid (e.g. Feb 30)
                $daysInNextMonth = $nextDate->daysInMonth;
                $targetDay = min($schedule->day_of_month, $daysInNextMonth);
                $nextDate->day($targetDay);
            }
            
            $schedule->next_emission_date = $nextDate;
            $schedule->save();
        }
    }
}
