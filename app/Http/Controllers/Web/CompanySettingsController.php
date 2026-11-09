<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Models\Company;
use App\Services\ImpersonationManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class CompanySettingsController extends Controller
{
    public function __construct(
        private readonly ImpersonationManager $impersonationManager
    ) {}

    public function index(): Response
    {
        $companyId = $this->impersonationManager->getActiveCompanyId();
        $company = $companyId ? Company::with('certificates')->find($companyId) : null;

        $certificate = $company?->certificates()->latest('id')->first();

        return Inertia::render('Companies/Settings', [
            'company' => $company ? [
                'id' => $company->id,
                'name' => $company->name,
                'fiscal_driver' => $company->fiscal_driver ?? 'acbr',
                'certificate' => $certificate ? [
                    'id' => $certificate->id,
                    'expires_at' => $certificate->expires_at?->format('d/m/Y') ?? 'Indefinido',
                    'is_valid' => $certificate->expires_at ? $certificate->expires_at->isFuture() : true,
                    'created_at' => $certificate->created_at?->format('d/m/Y') ?? '-',
                ] : null,
            ] : null,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $companyId = $this->impersonationManager->getActiveCompanyId();
        $company = Company::findOrFail($companyId);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'fiscal_driver' => ['nullable', 'string', 'in:acbr,mock,crawler'],
        ]);

        $company->update($validated);

        return redirect()->route('companies.settings')->with('success', 'Configurações atualizadas com sucesso.');
    }
}
