<?php
declare(strict_types=1);

namespace App\Models\Traits;

use App\Models\Scopes\HierarchicalTenantScope;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new HierarchicalTenantScope);
    }
}
