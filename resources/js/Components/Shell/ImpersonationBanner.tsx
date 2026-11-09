import React from 'react';
import { usePage, router } from '@inertiajs/react';
import { AlertTriangle, LogOut } from 'lucide-react';

export default function ImpersonationBanner() {
    const { props } = usePage<any>();
    const isImpersonating = props.auth?.is_impersonating;
    const activeCompany = props.active_company;

    if (!isImpersonating) {
        return null;
    }

    const exitImpersonation = () => {
        router.post('/api/exit-impersonation', {}, {
            onSuccess: () => {
                router.visit('/dashboard');
            }
        });
    };

    return (
        <div className="bg-amber-500 text-amber-950 px-4 py-2.5 flex justify-between items-center z-50 text-sm font-medium shadow-inner border-b border-amber-600/30">
            <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-950" />
                <span>
                    Você está acessando a empresa <strong>{activeCompany?.name || `#${props.active_company_id}`}</strong> em modo de personificação contábil.
                </span>
            </div>
            <button
                onClick={exitImpersonation}
                className="inline-flex items-center space-x-1.5 bg-amber-950 hover:bg-black text-white px-3 py-1 rounded text-xs font-semibold shadow transition-colors"
            >
                <LogOut className="w-3.5 h-3.5" />
                <span>Retornar ao Escritório</span>
            </button>
        </div>
    );
}
