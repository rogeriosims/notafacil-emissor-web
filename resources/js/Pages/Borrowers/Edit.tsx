import React, { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Users, ArrowLeft, Search, Loader2, Save, MapPin, Trash2 } from 'lucide-react';
import { lookupService } from '../../services/lookupService';

interface Borrower {
    id: string;
    name: string;
    tax_id: string;
    email: string | null;
    phone: string | null;
    street: string | null;
    number: string | null;
    neighborhood: string | null;
    city_code: string | null;
    state: string | null;
    zip_code: string | null;
    iss_withheld: boolean;
}

interface Props {
    borrower: Borrower;
}

export default function Edit({ borrower }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: borrower.name || '',
        tax_id: borrower.tax_id || '',
        email: borrower.email || '',
        phone: borrower.phone || '',
        street: borrower.street || '',
        number: borrower.number || '',
        neighborhood: borrower.neighborhood || '',
        city_code: borrower.city_code || '',
        state: borrower.state || '',
        zip_code: borrower.zip_code || '',
        iss_withheld: Boolean(borrower.iss_withheld),
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
            setData(prev => ({
                ...prev,
                name: res.companyName || res.name || prev.name,
                street: res.address?.street || prev.street,
                number: res.address?.number || prev.number,
                neighborhood: res.address?.neighborhood || prev.neighborhood,
                city_code: res.address?.ibgeCode || prev.city_code,
                state: res.address?.state || prev.state,
                zip_code: res.address?.zipCode || prev.zip_code,
            }));
            setFeedback(`Dados atualizados via ${res.source}!`);
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
            setData(prev => ({
                ...prev,
                street: res.street || prev.street,
                neighborhood: res.neighborhood || prev.neighborhood,
                city_code: res.ibgeCode || res.ibge || prev.city_code,
                state: res.state || prev.state,
            }));
        } catch (err: any) {
            setFeedback(err.message || 'Erro ao consultar CEP.');
        } finally {
            setIsSearchingCep(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('borrowers.update', borrower.id));
    };

    const handleDelete = () => {
        if (confirm(`Tem certeza que deseja remover o tomador "${borrower.name}"?`)) {
            router.delete(route('borrowers.destroy', borrower.id));
        }
    };

    return (
        <AppLayout>
            <Head title={`Editar Tomador: ${borrower.name}`} />

            <div className="max-w-3xl mx-auto space-y-6 pb-12">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href={route('borrowers.index')}
                            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Voltar para Tomadores</span>
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">{borrower.name}</h1>
                        <p className="text-sm text-slate-500">Atualize os dados cadastrais do tomador de serviços</p>
                    </div>

                    <button
                        type="button"
                        onClick={handleDelete}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Remover Tomador</span>
                    </button>
                </div>

                {feedback && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-700 flex items-center justify-between">
                        <span>{feedback}</span>
                        <button type="button" onClick={() => setFeedback(null)} className="text-blue-500 hover:text-blue-700 font-bold">×</button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                    {/* Seção 1: Identificação */}
                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
                            1. Identificação do Tomador
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    CPF / CNPJ *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        placeholder="00.000.000/0000-00"
                                        value={data.tax_id}
                                        onChange={(e) => setData('tax_id', e.target.value)}
                                        className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
                                    />
                                    {data.tax_id.replace(/\D/g, '').length === 14 && (
                                        <button
                                            type="button"
                                            onClick={handleSearchCnpj}
                                            disabled={isSearchingCnpj}
                                            className="px-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                                            title="Atualizar dados pelo CNPJ (ACBr/Receita)"
                                        >
                                            {isSearchingCnpj ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                                            <span>Sincronizar</span>
                                        </button>
                                    )}
                                </div>
                                {errors.tax_id && <p className="text-xs text-red-500 mt-1">{errors.tax_id}</p>}
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

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    E-mail (Para Envio da NFS-e)
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
                                    Telefone / WhatsApp
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
                    </div>

                    {/* Seção 2: Endereço */}
                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
                            2. Endereço Fiscal
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    CEP
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="00000-000"
                                        value={data.zip_code}
                                        onChange={(e) => setData('zip_code', e.target.value)}
                                        onBlur={handleSearchCep}
                                        className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSearchCep}
                                        disabled={isSearchingCep}
                                        className="px-2.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-200 text-xs font-semibold flex items-center justify-center disabled:opacity-50"
                                    >
                                        {isSearchingCep ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="md:col-span-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    Logradouro (Rua / Avenida)
                                </label>
                                <input
                                    type="text"
                                    value={data.street}
                                    onChange={(e) => setData('street', e.target.value)}
                                    className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    Número
                                </label>
                                <input
                                    type="text"
                                    value={data.number}
                                    onChange={(e) => setData('number', e.target.value)}
                                    className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    Bairro
                                </label>
                                <input
                                    type="text"
                                    value={data.neighborhood}
                                    onChange={(e) => setData('neighborhood', e.target.value)}
                                    className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    UF
                                </label>
                                <input
                                    type="text"
                                    maxLength={2}
                                    value={data.state}
                                    onChange={(e) => setData('state', e.target.value.toUpperCase())}
                                    className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                                />
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    Cód. IBGE
                                </label>
                                <input
                                    type="text"
                                    placeholder="3550308"
                                    value={data.city_code}
                                    onChange={(e) => setData('city_code', e.target.value)}
                                    className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Seção 3: Regras Fiscais */}
                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
                            3. Regras Fiscais Padrão
                        </h2>

                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.iss_withheld}
                                    onChange={(e) => setData('iss_withheld', e.target.checked)}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                />
                                <div>
                                    <span className="text-sm font-medium text-slate-800">
                                        Tomador é Substituto Tributário (ISS Retido na Fonte por Padrão)
                                    </span>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Ao marcar esta opção, o simulador de NFS-e pré-selecionará ISS Retido ao emitir notas para este cliente.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Ações */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                        <Link
                            href={route('borrowers.index')}
                            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Cancelar
                        </Link>
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
        </AppLayout>
    );
}
