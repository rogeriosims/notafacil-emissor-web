import React from 'react';
import { usePage, router } from '@inertiajs/react';

export default function ImpersonationBanner() {
    const { props } = usePage();
    const activeCompanyId = props.active_company_id;

    if (!activeCompanyId) {
        return null;
    }

    const exitImpersonation = () => {
        router.post('/api/exit-impersonation');
    };

    return (
        <div className="bg-yellow-400 text-yellow-900 px-4 py-2 flex justify-between items-center z-50 relative">
            <div className="font-semibold">
                Você está personificando uma empresa (ID: {activeCompanyId})
            </div>
            <button
                onClick={exitImpersonation}
                className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded shadow text-sm font-bold"
            >
                Sair da Personificação
            </button>
        </div>
    );
}
