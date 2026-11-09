<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Models\Office;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class OfficeWebController extends Controller
{
    public function index(): Response
    {
        $offices = Office::withCount('companies')->latest('id')->paginate(15);

        return Inertia::render('Management/Offices/Index', [
            'offices' => $offices,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Management/Offices/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'document' => ['nullable', 'string'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string'],
        ]);

        Office::create($validated);

        return redirect()->route('management.offices.index')->with('success', 'Escritório contábil cadastrado com sucesso.');
    }

    public function edit(string $id): Response
    {
        $office = Office::with(['companies' => function ($q) {
            $q->select('id', 'office_id', 'name', 'cnpj', 'city', 'state');
        }])->withCount('companies')->findOrFail($id);

        return Inertia::render('Management/Offices/Edit', [
            'office' => $office,
        ]);
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $office = Office::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'document' => ['nullable', 'string'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string'],
        ]);

        $office->update($validated);

        return back()->with('success', 'Dados do escritório atualizados com sucesso.');
    }

    public function destroy(string $id): RedirectResponse
    {
        $office = Office::withCount('companies')->findOrFail($id);

        if ($office->companies_count > 0) {
            return back()->withErrors(['office' => 'Não é possível excluir um escritório que possui empresas vinculadas.']);
        }

        $office->delete();

        return redirect()->route('management.offices.index')->with('success', 'Escritório contábil excluído com sucesso.');
    }
}
