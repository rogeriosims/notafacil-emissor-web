import React from 'react';
import CompanySwitcher from '../Components/Shell/CompanySwitcher';
import { usePage } from '@inertiajs/react';

export default function Header() {
    const { props } = usePage();
    
    return (
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold text-slate-800">Painel de Controle</h1>
            </div>
            <div className="flex items-center space-x-4">
                <CompanySwitcher companies={props.companies} activeCompanyId={props.active_company_id} />
                <div className="text-sm font-medium text-slate-600">
                    {props.auth?.user?.name}
                </div>
            </div>
        </header>
    );
}
