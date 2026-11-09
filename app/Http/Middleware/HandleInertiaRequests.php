<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Services\ImpersonationManager;
use App\Models\Company;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): string|null
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $impersonator = app(ImpersonationManager::class);
        $user = $request->user();

        $activeCompanyId = $user ? $impersonator->getActiveCompanyId() : null;
        $activeCompany = null;
        $companies = [];

        if ($user) {
            $companies = $user->companies()->get(['companies.id', 'companies.name'])->toArray();
            
            // Se for admin do escritório e não tiver empresas associadas diretamente, pega as empresas do escritório
            if (empty($companies) && $user->office_id) {
                $companies = Company::where('office_id', $user->office_id)->get(['id', 'name'])->toArray();
            }

            if ($activeCompanyId) {
                $activeCompany = Company::find($activeCompanyId, ['id', 'name']);
            }
        }

        $isImpersonating = session()->has('impersonate_company_id');

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'role' => $user?->role ?? 'user',
                'is_impersonating' => $isImpersonating,
            ],
            'active_company_id' => $activeCompanyId,
            'active_company' => $activeCompany,
            'companies' => $companies,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
