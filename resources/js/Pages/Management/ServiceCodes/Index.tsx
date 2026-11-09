import React, { useState } from 'react';
import AppLayout from '../../../Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { BookOpen, Search } from 'lucide-react';

interface ServiceCodeItem {
    code: string;
    description: string;
    min_rate: number;
    max_rate: number;
}

interface Props {
    service_codes: {
        data: ServiceCodeItem[];
        total: number;
    };
    filters?: {
        search?: string;
    };
}

export default function Index({ service_codes, filters = {} }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/management/service-codes', { search }, { preserveState: true });
    };

    return (
        <AppLayout>
            <Head title="Tabela LC 116 Nacional" />

            <div className="space-y-6 max-w-7xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                        Lista de Serviços - Lei Complementar 116/2003
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Tabela canônica de serviços do Padrão Nacional para emissão de NFS-e
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar código (ex: 1.01) ou palavra-chave na descrição..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                            Buscar
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-3.5 w-28">Subitem LC 116</th>
                                    <th className="px-6 py-3.5">Descrição Oficial do Fisco</th>
                                    <th className="px-6 py-3.5 w-32">Piso Alíquota</th>
                                    <th className="px-6 py-3.5 w-32">Teto Alíquota</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {service_codes?.data?.map((sc) => (
                                    <tr key={sc.code} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-6 py-4 font-mono font-black text-emerald-700 text-sm">{sc.code}</td>
                                        <td className="px-6 py-4 text-slate-700 leading-relaxed">{sc.description}</td>
                                        <td className="px-6 py-4 font-bold text-slate-600">{sc.min_rate}%</td>
                                        <td className="px-6 py-4 font-bold text-slate-600">{sc.max_rate}%</td>
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
