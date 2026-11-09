import React from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Briefcase, Plus, CheckCircle2 } from 'lucide-react';

interface ServiceItem {
    id: number;
    service_code: string;
    cnae_code: string | null;
    description: string;
    default_rate: number;
    allow_retention: boolean;
}

interface Props {
    services: {
        data: ServiceItem[];
        total: number;
    };
}

export default function Index({ services }: Props) {
    return (
        <AppLayout>
            <Head title="Serviços da Empresa" />

            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Catálogo de Serviços da Empresa</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Itens de serviço vinculados à sua empresa com código LC 116 e alíquotas municipais
                        </p>
                    </div>

                    <Link
                        href="/services/create"
                        className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Novo Serviço</span>
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-3.5">Código LC 116</th>
                                    <th className="px-6 py-3.5">Descrição do Serviço</th>
                                    <th className="px-6 py-3.5">CNAE</th>
                                    <th className="px-6 py-3.5">Alíquota ISS</th>
                                    <th className="px-6 py-3.5">Retenção</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {services?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                            <p className="font-medium text-slate-600">Nenhum serviço cadastrado</p>
                                            <p className="text-xs text-slate-400 mt-1">Cadastre o primeiro serviço prestado pela sua empresa</p>
                                        </td>
                                    </tr>
                                ) : (
                                    services.data.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-emerald-700">{s.service_code}</td>
                                            <td className="px-6 py-4 font-semibold text-slate-800">{s.description}</td>
                                            <td className="px-6 py-4 font-mono text-slate-500">{s.cnae_code || '-'}</td>
                                            <td className="px-6 py-4 font-bold text-slate-800">{s.default_rate}%</td>
                                            <td className="px-6 py-4">
                                                {s.allow_retention ? (
                                                    <span className="inline-flex items-center text-emerald-700 font-medium">
                                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                                        Permitida
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">Vedada</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
