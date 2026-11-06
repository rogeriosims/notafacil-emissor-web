<?php
declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\ImpersonationManager;
use Illuminate\Support\Facades\Auth;

class EnsureTenantContext
{
    public function __construct(private ImpersonationManager $impersonator)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if ($user) {
            $impersonateCompanyId = $request->header('X-Impersonate-Company-Id') ?? session('impersonate_company_id');

            if ($impersonateCompanyId) {
                // Check if user is allowed to impersonate this company
                if ($user->role === 'SUPER_ADMIN' || ($user->role === 'OFFICE_USER' && \App\Models\Company::withoutGlobalScopes()->where('id', $impersonateCompanyId)->where('office_id', $user->office_id)->exists())) {
                    $this->impersonator->impersonate((string) $impersonateCompanyId);
                }
            }
        }

        return $next($request);
    }
}
