<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class BatchDeletionBlockedException extends Exception
{
    public function render($request): JsonResponse
    {
        return response()->json([
            'message' => 'O lote não pode ser excluído pois contém notas autorizadas.'
        ], 403);
    }
}
