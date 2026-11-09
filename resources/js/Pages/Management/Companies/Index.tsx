import React from 'react';
import AppLayout from '../../../Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Building2, Plus, ShieldCheck, AlertCircle, Building } from 'lucide-react';
import { formatCpfCnpj } from '../../../lib/utils';

interface CompanyItem {
    id: string;
    name: string;
    cnpj: string | null;
    fiscal_driver: string | null;
    office?: {
        id: string;
        name: string;
    } | null;
    certificates_count: number;
    created_at: string;
}

interface Props {
    companies: {
        data: CompanyItem[];
        total: number;
    };
}

export default function Index({ companies }: Props) {
    return (
        <AppLayout>
            <Head title="Empresas Clientes" />

            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Empresas Clientes (Emitentes)</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Cadastro das empresas emissoras de NFS-e vinculadas aos escritórios
                        </p>
                    </div>

                    <Link
                        href="/management/companies/create"
                        className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nova Empresa</span>
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-3.5">Empresa Emitente</th>
                                    <th className="px-6 py-3.5">CNPJ</th>
                                    <th className="px-6 py-3.5">Escritório Responsável</th>
                                    <th className="px-6 py-3.5">Provedor Fiscal</th>
                                    <th className="px-6 py-3.5">Certificado A1</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {companies?.data?.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800 flex items-center space-x-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                            <span>{c.name}</span>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-semibold text-slate-600">
                                            {c.cnpj ? formatCpfCnpj(c.cnpj) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {c.office?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                                {c.fiscal_driver || 'acbr'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {c.certificates_count > 0 ? (
                                                <span className="inline-flex items-center text-emerald-700 font-semibold">
                                                    <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />
                                                    Ativo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center text-amber-600 font-medium">
                                                    <AlertCircle className="w-4 h-4 mr-1 text-amber-500" />
                                                    Pendente
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
