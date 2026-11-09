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
}
