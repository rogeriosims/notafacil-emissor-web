<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Domain\Fiscal\DTOs\CanonicalInvoiceDTO;
use App\Domain\Fiscal\Services\TaxEngineService;
use App\Models\ServiceItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class SimulationController extends Controller
{
    public function __construct(
        private readonly TaxEngineService $taxEngine
    ) {}

    public function simulate(Request $request): JsonResponse
    {
        $amount = (float) $request->input('amount', 0);
        if ($amount <= 0) {
            return response()->json([
                'base_amount' => 0.0,
                'iss_rate' => 0.0,
                'iss_amount' => 0.0,
                'net_amount' => 0.0,
                'irrf_amount' => 0.0,
                'csrf_amount' => 0.0,
                'inss_amount' => 0.0,
                'adr005_applied' => false,
            ]);
        }

        $serviceItemId = $request->input('service_item_id');
        $issRate = (float) $request->input('iss_rate', 2.0);

        if ($serviceItemId) {
            $service = ServiceItem::find($serviceItemId);
            if ($service && $service->aliquota_iss) {
                $issRate = (float) $service->aliquota_iss;
            }
        }

        // Garante que alíquota fique no limite legal (2% a 5%)
        $issRate = max(2.0, min(5.0, $issRate));

        $dto = new CanonicalInvoiceDTO(
            serviceValue: $amount,
            issRate: $issRate,
            allowRetention: true,
            opSimpNac: (int) $request->input('op_simples', 1), // 1 = Normal, 2 = MEI, 3 = Simples
            issWithheldByTomador: (bool) $request->input('iss_withheld', false),
            issDueAtExecution: (bool) $request->input('iss_due_at_execution', false),
            snRetentionSubject: (bool) $request->input('sn_retention_subject', false),
            isTomadorCpf: (bool) $request->input('is_tomador_cpf', false),
            isAnexoIV: (bool) $request->input('is_anexo_iv', false),
            hasCessaoMaoDeObra: (bool) $request->input('has_cessao_mao_de_obra', false)
        );

        $result = $this->taxEngine->calculate($dto);

        return response()->json([
            'base_amount' => number_format($amount, 2, '.', ''),
            'iss_rate' => number_format($issRate, 2, '.', ''),
            'iss_amount' => number_format($result->iss->value, 2, '.', ''),
            'irrf_amount' => number_format($result->irrf->value, 2, '.', ''),
            'csrf_amount' => number_format($result->csrf->totalValue, 2, '.', ''),
            'inss_amount' => number_format($result->inss->value, 2, '.', ''),
            'net_amount' => number_format($result->netValue, 2, '.', ''),
            'adr005_applied' => $result->irrf->dispensedByAdr005 || $result->csrf->dispensedByAdr005,
            'details' => [
                'pis' => number_format($result->csrf->pisValue, 2, '.', ''),
                'cofins' => number_format($result->csrf->cofinsValue, 2, '.', ''),
                'csll' => number_format($result->csrf->csllValue, 2, '.', ''),
            ]
        ]);
    }
}
