<?php
declare(strict_types=1);

namespace App\Services;

class ImpersonationManager
{
    protected ?string $activeCompanyId = null;

    public function impersonate(string $companyId): void
    {
        $this->activeCompanyId = $companyId;
    }

    public function getActiveCompanyId(): ?string
    {
        return $this->activeCompanyId;
    }
}
