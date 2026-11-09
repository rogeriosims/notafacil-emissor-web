import React, { useState } from 'react';
import AppLayout from '../../../Layouts/AppLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Building, ArrowLeft, Search, Loader2, Save, Trash2, Building2, ExternalLink } from 'lucide-react';
import { lookupService } from '../../../services/lookupService';

interface Company {
    id: string;
    name: string;
    cnpj: string;
    city: string | null;
    state: string | null;
}

interface Office {
    id: string;
    name: string;
    document: string | null;
    email: string | null;
    phone: string | null;
    companies_count: number;
    companies?: Company[];
}

interface Props {
    office: Office;
}

export default function Edit({ office }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: office.name || '',
        document: office.document || '',
        email: office.email || '',
        phone: office.phone || '',
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
            setData(prev => ({
                ...prev,
                name: res.companyName || res.name || prev.name,
                email: res.email || prev.email,
            }));
            setFeedback(`Dados sincronizados via ${res.source}!`);
        } catch (err: any) {
            setFeedback(err.message || 'Erro ao consultar CNPJ.');
        } finally {
            setIsSearchingCnpj(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('management.offices.update', office.id));
    };

    const handleDelete = () => {
        if (office.companies_count > 0) {
            alert('Não é possível excluir um escritório que gerencia empresas cadastradas.');
            return;
        }

        if (confirm(`Tem certeza que deseja remover o escritório "${office.name}"?`)) {
            router.delete(route('management.offices.destroy', office.id));
        }
    };

    return (
        <AppLayout>
            <Head title={`Editar Escritório: ${office.name}`} />

            <div className="max-w-4xl mx-auto space-y-6 pb-12">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href={route('management.offices.index')}
                            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Voltar aos Escritórios</span>
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">{office.name}</h1>
                        <p className="text-sm text-slate-500">
                            Gerencie os dados cadastrais e as empresas sob gestão deste escritório contábil
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={office.companies_count > 0}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title={office.companies_count > 0 ? 'Desvincule as empresas antes de excluir' : 'Excluir escritório'}
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Excluir Escritório</span>
                    </button>
                </div>

                {feedback && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-700 flex items-center justify-between">
                        <span>{feedback}</span>
                        <button type="button" onClick={() => setFeedback(null)} className="text-blue-500 hover:text-blue-700 font-bold">×</button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Formulário de Dados */}
                    <div className="md:col-span-2">
                        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
                                Dados Cadastrais
                            </h2>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    CNPJ do Escritório
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="00.000.000/0000-00"
                                        value={data.document}
                                        onChange={(e) => setData('document', e.target.value)}
                                        className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSearchCnpj}
                                        disabled={isSearchingCnpj}
                                        className="px-4 bg-slate-100 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                                    >
                                        {isSearchingCnpj ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                        <span>Buscar</span>
                                    </button>
                                </div>
                                {errors.document && <p className="text-xs text-red-500 mt-1">{errors.document}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    Nome / Razão Social *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                        E-mail de Contato
                                    </label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                        Telefone
                                    </label>
                                    <input
                                        type="text"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Salvando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Salvar Alterações</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Empresas Vinculadas */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4 text-blue-600" />
                                    <span>Empresas ({office.companies_count})</span>
                                </h3>
                                <Link
                                    href={route('management.companies.create')}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                                >
                                    + Nova
                                </Link>
                            </div>

                            {office.companies && office.companies.length > 0 ? (
                                <div className="space-y-2">
                                    {office.companies.map((c) => (
                                        <Link
                                            key={c.id}
                                            href={route('management.companies.edit', c.id)}
                                            className="block p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 truncate">
                                                    {c.name}
                                                </p>
                                                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0 ml-1" />
                                            </div>
                                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                                {c.cnpj}
                                            </p>
                                            {c.city && (
                                                <p className="text-[10px] text-slate-400 mt-1">
                                                    {c.city} - {c.state}
                                                </p>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 py-4 text-center">
                                    Nenhuma empresa vinculada a este escritório ainda.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
