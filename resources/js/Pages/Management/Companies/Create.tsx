import React, { useState } from 'react';
import AppLayout from '../../../Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Building2, ArrowLeft, Search, Loader2, Save } from 'lucide-react';
import { lookupService } from '../../../services/lookupService';

interface Office {
    id: string;
    name: string;
}

interface Props {
    offices: Office[];
}

export default function Create({ offices }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        office_id: offices[0]?.id || '',
        name: '',
        cnpj: '',
        trade_name: '',
        municipal_registration: '',
        city_code: '',
        state: '',
        fiscal_driver: 'acbr',
    });

    const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    const handleSearchCnpj = async () => {
        const clean = data.cnpj.replace(/\D/g, '');
        if (clean.length !== 14) return;
        setIsSearchingCnpj(true);
        setFeedback(null);
        try {
            const res = await lookupService.fetchCnpj(clean);
            setData({
                ...data,
                name: res.companyName || res.name,
                trade_name: res.tradeName || '',
                city_code: res.address?.ibgeCode || '',
                state: res.address?.state || '',
            });
            setFeedback(`Dados preenchidos via ${res.source}!`);
        } catch (err: any) {
            setFeedback(err.message || 'Erro ao consultar CNPJ.');
        } finally {
            setIsSearchingCnpj(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/management/companies');
    };

    return (
        <AppLayout>
            <Head title="Cadastrar Empresa Cliente" />

            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <Link
                        href="/management/companies"
                        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Voltar às Empresas</span>
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Nova Empresa Emitente</h1>
                    <p className="text-sm text-slate-500">Cadastre uma nova empresa cliente com preenchimento via CNPJ</p>
                </div>

                {feedback && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium">
                        {feedback}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Escritório Contábil Responsável *
                        </label>
                        <select
                            value={data.office_id}
                            onChange={(e) => setData('office_id', e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        >
                            {offices.map(o => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">CNPJ da Empresa *</label>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                placeholder="00.000.000/0000-00"
                                value={data.cnpj}
                                onChange={(e) => setData('cnpj', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                required
                            />
                            <button
                                type="button"
                                onClick={handleSearchCnpj}
                                disabled={isSearchingCnpj || data.cnpj.replace(/\D/g, '').length !== 14}
                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shrink-0 flex items-center space-x-1"
                            >
                                {isSearchingCnpj ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                                <span>Buscar</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Razão Social *</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        />
                        {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Fantasia</label>
                            <input
                                type="text"
                                value={data.trade_name}
                                onChange={(e) => setData('trade_name', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Inscrição Municipal</label>
                            <input
                                type="text"
                                value={data.municipal_registration}
                                onChange={(e) => setData('municipal_registration', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Código IBGE Município</label>
                            <input
                                type="text"
                                value={data.city_code}
                                onChange={(e) => setData('city_code', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">UF</label>
                            <input
                                type="text"
                                maxLength={2}
                                value={data.state}
                                onChange={(e) => setData('state', e.target.value.toUpperCase())}
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Provedor Fiscal</label>
                            <select
                                value={data.fiscal_driver}
                                onChange={(e) => setData('fiscal_driver', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="acbr">ACBr API</option>
                                <option value="mock">Mock</option>
                                <option value="crawler">Crawler</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all shadow-sm"
                        >
                            <Save className="w-3.5 h-3.5" />
                            <span>Salvar Empresa</span>
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
