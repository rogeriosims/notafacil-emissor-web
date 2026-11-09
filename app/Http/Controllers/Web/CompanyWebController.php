<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Models\Company;
use App\Models\Office;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class CompanyWebController extends Controller
{
    public function index(): Response
    {
        $companies = Company::with('office')->withCount('certificates')->latest('id')->paginate(15);

        return Inertia::render('Management/Companies/Index', [
            'companies' => $companies,
        ]);
    }

    public function create(): Response
    {
        $offices = Office::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Management/Companies/Create', [
            'offices' => $offices,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'office_id' => ['required', 'exists:offices,id'],
            'name' => ['required', 'string', 'max:255'],
            'cnpj' => ['nullable', 'string'],
            'trade_name' => ['nullable', 'string'],
            'municipal_registration' => ['nullable', 'string'],
            'city_code' => ['nullable', 'string'],
            'state' => ['nullable', 'string', 'max:2'],
            'fiscal_driver' => ['nullable', 'string'],
        ]);

        Company::create($validated);

        return redirect()->route('management.companies.index')->with('success', 'Empresa cliente cadastrada com sucesso.');
    }
}
