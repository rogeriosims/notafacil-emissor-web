<?php

namespace App\Policies;

use App\Models\Company;
use App\Models\User;

class CompanyPolicy
{
    /**
     * Determine whether the user can upload a certificate.
     */
    public function uploadCertificate(User $user, Company $company): bool
    {
        // Se for Super Admin
        if ($user->role === 'SUPER_ADMIN') {
            return true;
        }

        // Se for Usuário de Escritório e a empresa for do seu escritório
        if ($user->role === 'OFFICE_USER') {
            return $user->office_id === $company->office_id;
        }

        // Se for Usuário da Empresa e a empresa tiver a permissão de upload ligada
        if ($user->role === 'COMPANY_USER') {
            if ($user->companies()->where('companies.id', $company->id)->exists()) {
                return (bool) $company->allow_client_certificate_upload;
            }
        }

        return false;
    }
}
