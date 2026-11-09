import React, { useState } from 'react';
import AppLayout from '../../../Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Building, ArrowLeft, Search, Loader2, Save } from 'lucide-react';
import { lookupService } from '../../../services/lookupService';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        document: '',
        email: '',
        phone: '',
    });

    const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    const handleSearchCnpj = async () => {
        const clean = data.document.replace(/\D/g, '');
        if (clean.length !== 14) return;
        setIsSearchingCnpj(true);
        setFeedback(null);
        try {
            const res = await lookupService.fetchCnpj(clean);
            setData({
                ...data,
                name: res.companyName || res.name,
                email: res.companyName ? data.email : '',
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
        post('/management/offices');
    };

    return (
        <AppLayout>
            <Head title="Cadastrar Escritório Contábil" />

            <div className="max-w-xl mx-auto space-y-6">
                <div>
                    <Link
                        href="/management/offices"
                        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Voltar aos Escritórios</span>
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Novo Escritório Contábil</h1>
                    <p className="text-sm text-slate-500">Cadastre um novo escritório parceiro na plataforma</p>
                </div>

                {feedback && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium">
                        {feedback}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">CNPJ do Escritório</label>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                placeholder="00.000.000/0000-00"
                                value={data.document}
                                onChange={(e) => setData('document', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <button
                                type="button"
                                onClick={handleSearchCnpj}
                                disabled={isSearchingCnpj || data.document.replace(/\D/g, '').length !== 14}
                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shrink-0 flex items-center space-x-1"
                            >
                                {isSearchingCnpj ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                                <span>Buscar</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nome / Razão Social *</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        />
                        {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail de Contato</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone</label>
                        <input
                            type="text"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all shadow-sm"
                        >
                            <Save className="w-3.5 h-3.5" />
                            <span>Salvar Escritório</span>
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
