<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Models\ServiceCode;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ServiceCodeWebController extends Controller
{
    public function index(Request $request): Response
    {
        $query = ServiceCode::query();

        if ($search = $request->input('search')) {
            $query->where('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
        }

        $serviceCodes = $query->orderBy('code')->paginate(20)->withQueryString();

        return Inertia::render('Management/ServiceCodes/Index', [
            'service_codes' => $serviceCodes,
            'filters' => $request->only('search'),
        ]);
    }
}
