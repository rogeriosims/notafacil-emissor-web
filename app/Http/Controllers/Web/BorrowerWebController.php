<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Models\Customer;
use App\Services\ImpersonationManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class BorrowerWebController extends Controller
{
    public function __construct(
        private readonly ImpersonationManager $impersonationManager
    ) {}

    public function index(Request $request): Response
    {
        $companyId = $this->impersonationManager->getActiveCompanyId();

        $query = Customer::query();
        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('tax_id', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $borrowers = $query->latest('id')->paginate(15)->withQueryString();

        return Inertia::render('Borrowers/Index', [
            'borrowers' => $borrowers,
            'filters' => $request->only('search'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Borrowers/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = $this->impersonationManager->getActiveCompanyId();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'tax_id' => ['required', 'string'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string'],
            'street' => ['nullable', 'string'],
            'number' => ['nullable', 'string'],
            'neighborhood' => ['nullable', 'string'],
            'city_code' => ['nullable', 'string'],
            'state' => ['nullable', 'string', 'max:2'],
            'zip_code' => ['nullable', 'string'],
            'iss_withheld' => ['nullable', 'boolean'],
        ]);

        $cleanTaxId = preg_replace('/\D/', '', $validated['tax_id']);

        Customer::create([
            'company_id' => $companyId,
            'name' => $validated['name'],
            'tax_id' => $cleanTaxId,
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'street' => $validated['street'] ?? null,
            'number' => $validated['number'] ?? null,
            'neighborhood' => $validated['neighborhood'] ?? null,
            'city_code' => $validated['city_code'] ?? null,
            'state' => $validated['state'] ?? null,
            'zip_code' => preg_replace('/\D/', '', $validated['zip_code'] ?? ''),
            'iss_withheld' => (bool) ($validated['iss_withheld'] ?? false),
        ]);

        return redirect()->route('borrowers.index')->with('success', 'Tomador cadastrado com sucesso.');
    }
}
