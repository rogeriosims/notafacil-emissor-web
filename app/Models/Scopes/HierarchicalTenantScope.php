<?php
declare(strict_types=1);

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;
use App\Services\ImpersonationManager;
use Illuminate\Support\Facades\DB;

class HierarchicalTenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        if (app()->runningInConsole() && !app()->runningUnitTests()) {
            return;
        }

        $user = Auth::user();
        if (!$user) {
            return;
        }

        $impersonator = app(ImpersonationManager::class);
        $activeCompanyId = $impersonator->getActiveCompanyId();

        if ($activeCompanyId) {
            if ($model instanceof \App\Models\Company) {
                $builder->where('id', $activeCompanyId);
            } else {
                $builder->where('company_id', $activeCompanyId);
            }
            return;
        }

        if ($user->role === 'SUPER_ADMIN') {
            return;
        }

        if ($user->role === 'OFFICE_USER') {
            $builder->where('office_id', $user->office_id);
            return;
        }

        if ($user->role === 'COMPANY_USER') {
             if ($model instanceof \App\Models\Company) {
                 $builder->whereIn('id', DB::table('company_user')->select('company_id')->where('user_id', $user->id));
             } else {
                 $builder->whereIn('company_id', DB::table('company_user')->select('company_id')->where('user_id', $user->id));
             }
        }
    }
}
