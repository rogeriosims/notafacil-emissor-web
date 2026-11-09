import React, { useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { Building2, ChevronDown, Check, Search, LogOut } from 'lucide-react';

export default function CompanySwitcher() {
    const { props } = usePage<any>();
    const companies = props.companies || [];
    const activeCompanyId = props.active_company_id;
    const activeCompany = props.active_company || companies.find((c: any) => c.id === activeCompanyId);

    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = companies.filter((c: any) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectCompany = (companyId: number) => {
        router.post('/api/set-impersonation', { company_id: companyId }, {
            onSuccess: () => {
                setIsOpen(false);
                router.reload();
            }
        });
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors text-sm font-medium shadow-sm"
            >
                <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <Building2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-left max-w-[180px] truncate">
                    <span className="block text-xs text-slate-400 font-normal leading-tight">Empresa Ativa</span>
                    <span className="block truncate font-semibold text-slate-700 leading-tight">
                        {activeCompany?.name || 'Selecione uma empresa...'}
                    </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <div className="p-2.5 border-b border-slate-100 bg-slate-50">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar empresa..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto py-1">
                            {filtered.length === 0 ? (
                                <div className="p-3 text-center text-xs text-slate-400">
                                    Nenhuma empresa encontrada
                                </div>
                            ) : (
                                filtered.map((company: any) => (
                                    <button
                                        key={company.id}
                                        onClick={() => selectCompany(company.id)}
                                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                            company.id === activeCompanyId ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-700'
                                        }`}
                                    >
                                        <div className="truncate pr-2">
                                            <span className="block truncate">{company.name}</span>
                                        </div>
                                        {company.id === activeCompanyId && (
                                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
