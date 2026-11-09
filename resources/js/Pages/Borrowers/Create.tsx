import React, { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Users, ArrowLeft, Search, Loader2, Save, MapPin } from 'lucide-react';
import { lookupService } from '../../services/lookupService';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        tax_id: '',
        email: '',
        phone: '',
        street: '',
        number: '',
        neighborhood: '',
        city_code: '',
        state: '',
        zip_code: '',
        iss_withheld: false,
    });

    const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
    const [isSearchingCep, setIsSearchingCep] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    const handleSearchCnpj = async () => {
        const clean = data.tax_id.replace(/\D/g, '');
        if (clean.length !== 14) return;
        setIsSearchingCnpj(true);
        setFeedback(null);
        try {
            const res = await lookupService.fetchCnpj(clean);
            setData({
                ...data,
                name: res.companyName || res.name,
                street: res.address?.street || '',
                number: res.address?.number || '',
                neighborhood: res.address?.neighborhood || '',
                city_code: res.address?.ibgeCode || '',
                state: res.address?.state || '',
                zip_code: res.address?.zipCode || '',
            });
            setFeedback(`Dados preenchidos via ${res.source}!`);
        } catch (err: any) {
            setFeedback(err.message || 'Erro ao consultar CNPJ.');
        } finally {
            setIsSearchingCnpj(false);
        }
    };

    const handleSearchCep = async () => {
        const clean = data.zip_code.replace(/\D/g, '');
        if (clean.length !== 8) return;
        setIsSearchingCep(true);
        try {
            const res = await lookupService.fetchCep(clean);
            setData({
                ...data,
                street: res.street,
                neighborhood: res.neighborhood,
                city_code: res.ibgeCode || res.ibge,
                state: res.state,
            });
        } catch (err: any) {
            setFeedback(err.message || 'Erro ao consultar CEP.');
        } finally {
            setIsSearchingCep(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/borrowers');
    };

    return (
        <AppLayout>
            <Head title="Cadastrar Tomador de Serviço" />

            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <Link
                        href="/borrowers"
                        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Voltar para Lista de Tomadores</span>
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Novo Tomador de Serviço</h1>
                    <p className="text-sm text-slate-500">Cadastre clientes com preenchimento em 1 clique via CNPJ e CEP</p>
                </div>

                {feedback && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium">
                        {feedback}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">CPF ou CNPJ *</label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    placeholder="00.000.000/0000-00"
                                    value={data.tax_id}
                                    onChange={(e) => setData('tax_id', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={handleSearchCnpj}
                                    disabled={isSearchingCnpj || data.tax_id.replace(/\D/g, '').length !== 14}
                                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shrink-0 flex items-center space-x-1"
                                >
                                    {isSearchingCnpj ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                                    <span>Buscar</span>
                                </button>
                            </div>
                            {errors.tax_id && <p className="text-[11px] text-red-600 mt-1">{errors.tax_id}</p>}
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
                            <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
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
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Endereço do Tomador</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">CEP</label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        placeholder="00000-000"
                                        value={data.zip_code}
                                        onChange={(e) => setData('zip_code', e.target.value)}
                                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSearchCep}
                                        disabled={isSearchingCep || data.zip_code.replace(/\D/g, '').length !== 8}
                                        className="px-2.5 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg text-xs font-bold shrink-0"
                                    >
                                        {isSearchingCep ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Rua / Logradouro</label>
                                <input
                                    type="text"
                                    value={data.street}
                                    onChange={(e) => setData('street', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Número</label>
                                <input
                                    type="text"
                                    value={data.number}
                                    onChange={(e) => setData('number', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Bairro</label>
                                <input
                                    type="text"
                                    value={data.neighborhood}
                                    onChange={(e) => setData('neighborhood', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Código IBGE Município</label>
                                <input
                                    type="text"
                                    value={data.city_code}
                                    onChange={(e) => setData('city_code', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all shadow-sm"
                        >
                            <Save className="w-3.5 h-3.5" />
                            <span>Salvar Tomador</span>
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
