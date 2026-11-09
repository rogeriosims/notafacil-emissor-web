import React, { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Users, Plus, Search, MapPin, Mail, Phone } from 'lucide-react';
import { formatCpfCnpj } from '../../lib/utils';

interface CustomerItem {
    id: number;
    name: string;
    tax_id: string;
    email: string | null;
    phone: string | null;
    street: string | null;
    number: string | null;
    city_code: string | null;
    state: string | null;
    created_at: string;
}

interface Props {
    borrowers: {
        data: CustomerItem[];
        total: number;
    };
    filters?: {
        search?: string;
    };
}

export default function Index({ borrowers, filters = {} }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/borrowers', { search }, { preserveState: true });
    };

    return (
        <AppLayout>
            <Head title="Tomadores de Serviço" />

            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Tomadores de Serviço (Clientes)</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Cadastro e gestão de clientes para emissão rápida de notas fiscais
                        </p>
                    </div>

                    <Link
                        href="/borrowers/create"
                        className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Novo Tomador</span>
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por Razão Social, Nome, CNPJ ou E-mail..."
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
                                    <th className="px-6 py-3.5">Tomador / Razão Social</th>
                                    <th className="px-6 py-3.5">CPF / CNPJ</th>
                                    <th className="px-6 py-3.5">Contato</th>
                                    <th className="px-6 py-3.5">Localização</th>
                                    <th className="px-6 py-3.5 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {borrowers?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                            <p className="font-medium text-slate-600">Nenhum tomador cadastrado</p>
                                            <p className="text-xs text-slate-400 mt-1">Cadastre o primeiro cliente para emitir NFS-e</p>
                                        </td>
                                    </tr>
                                ) : (
                                    borrowers.data.map((b) => (
                                        <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-800">{b.name}</td>
                                            <td className="px-6 py-4 font-mono font-semibold text-slate-600">
                                                {formatCpfCnpj(b.tax_id)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {b.email && (
                                                    <div className="flex items-center space-x-1">
                                                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>{b.email}</span>
                                                    </div>
                                                )}
                                                {b.phone && (
                                                    <div className="flex items-center space-x-1 text-slate-400 mt-0.5">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        <span>{b.phone}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {b.street ? (
                                                    <div className="flex items-center space-x-1">
                                                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span>{b.street}, {b.number} - {b.state}</span>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={route('borrowers.edit', b.id)}
                                                    className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                                >
                                                    Editar
                                                </Link>
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
