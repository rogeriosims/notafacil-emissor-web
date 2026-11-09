import React from 'react';
import AppLayout from '../../../Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Building, Plus, Building2, Mail, Phone } from 'lucide-react';
import { formatCpfCnpj } from '../../../lib/utils';

interface OfficeItem {
    id: string;
    name: string;
    document: string | null;
    email: string | null;
    phone: string | null;
    companies_count: number;
    created_at: string;
}

interface Props {
    offices: {
        data: OfficeItem[];
        total: number;
    };
}

export default function Index({ offices }: Props) {
    return (
        <AppLayout>
            <Head title="Escritórios Contábeis" />

            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Escritórios Contábeis Parceiros</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Gestão de escritórios contábeis e tenants da plataforma
                        </p>
                    </div>

                    <Link
                        href="/management/offices/create"
                        className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Novo Escritório</span>
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-3.5">Escritório Contábil</th>
                                    <th className="px-6 py-3.5">CNPJ</th>
                                    <th className="px-6 py-3.5">Contato</th>
                                    <th className="px-6 py-3.5">Empresas Gerenciadas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {offices?.data?.map((o) => (
                                    <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800 flex items-center space-x-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                                                <Building className="w-4 h-4" />
                                            </div>
                                            <span>{o.name}</span>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-semibold text-slate-600">
                                            {o.document ? formatCpfCnpj(o.document) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {o.email && (
                                                <div className="flex items-center space-x-1">
                                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>{o.email}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800">
                                                {o.companies_count} empresa(s)
                                            </span>
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
