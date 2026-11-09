<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Infrastructure\Fiscal\FiscalManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;

class LookupController extends Controller
{
    public function __construct(
        private readonly FiscalManager $fiscalManager
    ) {}

    /**
     * Consulta agnóstica de CNPJ com prioridade no provedor fiscal ativo (ACBr) e cache de 7 dias.
     */
    public function cnpj(string $cnpj): JsonResponse
    {
        $clean = preg_replace('/\D/', '', $cnpj);

        if (strlen($clean) !== 14) {
            return response()->json([
                'success' => false,
                'error' => 'CNPJ inválido. Forneça exatamente 14 dígitos numéricos.',
            ], 422);
        }

        try {
            $data = Cache::remember("lookup:cnpj:{$clean}", 86400 * 7, function () use ($clean) {
                $provider = $this->fiscalManager->driver();
                return $provider->lookupCnpj($clean)->toArray();
            });

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Consulta agnóstica de CEP com prioridade no provedor fiscal ativo (ACBr) e cache de 30 dias.
     */
    public function cep(string $cep): JsonResponse
    {
        $clean = preg_replace('/\D/', '', $cep);

        if (strlen($clean) !== 8) {
            return response()->json([
                'success' => false,
                'error' => 'CEP inválido. Forneça exatamente 8 dígitos numéricos.',
            ], 422);
        }

        try {
            $data = Cache::remember("lookup:cep:{$clean}", 86400 * 30, function () use ($clean) {
                $provider = $this->fiscalManager->driver();
                return $provider->lookupCep($clean)->toArray();
            });

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
