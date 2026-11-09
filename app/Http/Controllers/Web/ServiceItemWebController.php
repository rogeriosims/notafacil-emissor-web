<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Models\ServiceCode;
use App\Models\ServiceItem;
use App\Services\ImpersonationManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ServiceItemWebController extends Controller
{
    public function __construct(
        private readonly ImpersonationManager $impersonationManager
    ) {}

    public function index(): Response
    {
        $companyId = $this->impersonationManager->getActiveCompanyId();

        $services = ServiceItem::query()
            ->when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->latest('id')
            ->paginate(15);

        return Inertia::render('Services/Index', [
            'services' => $services,
        ]);
    }

    public function create(): Response
    {
        $serviceCodes = ServiceCode::orderBy('code')->get();

        return Inertia::render('Services/Create', [
            'service_codes' => $serviceCodes,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = $this->impersonationManager->getActiveCompanyId()
            ?? $request->input('company_id')
            ?? $request->user()?->companies()->first()?->id;

        $validated = $request->validate([
            'service_code' => ['required', 'string'],
            'description' => ['required', 'string'],
            'default_rate' => ['required', 'numeric', 'min:2', 'max:5'],
            'cnae_code' => ['nullable', 'string'],
            'allow_retention' => ['nullable', 'boolean'],
        ]);

        ServiceItem::create([
            'company_id' => $companyId,
            'service_code' => $validated['service_code'],
            'description' => $validated['description'],
            'default_rate' => $validated['default_rate'],
            'cnae_code' => $validated['cnae_code'] ?? null,
            'allow_retention' => (bool) ($validated['allow_retention'] ?? true),
        ]);

        return redirect()->route('services.index')->with('success', 'Serviço municipal cadastrado com sucesso.');
    }

    public function edit(string $id): Response
    {
        $service = ServiceItem::findOrFail($id);
        $serviceCodes = ServiceCode::orderBy('code')->get();

        return Inertia::render('Services/Edit', [
            'service' => $service,
            'service_codes' => $serviceCodes,
        ]);
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $service = ServiceItem::findOrFail($id);

        $validated = $request->validate([
            'service_code' => ['required', 'string'],
            'description' => ['required', 'string'],
            'default_rate' => ['required', 'numeric', 'min:2', 'max:5'],
            'cnae_code' => ['nullable', 'string'],
            'allow_retention' => ['nullable', 'boolean'],
        ]);

        $service->update([
            'service_code' => $validated['service_code'],
            'description' => $validated['description'],
            'default_rate' => $validated['default_rate'],
            'cnae_code' => $validated['cnae_code'] ?? null,
            'allow_retention' => (bool) ($validated['allow_retention'] ?? true),
        ]);

        return redirect()->route('services.index')->with('success', 'Serviço municipal atualizado com sucesso.');
    }

    public function destroy(string $id): RedirectResponse
    {
        $service = ServiceItem::findOrFail($id);
        $service->delete();

        return redirect()->route('services.index')->with('success', 'Serviço municipal excluído com sucesso.');
    }
}
