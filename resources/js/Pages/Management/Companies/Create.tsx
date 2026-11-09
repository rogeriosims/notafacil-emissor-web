import React, { useState } from 'react';
import AppLayout from '../../../Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Building2,
    ArrowLeft,
    Search,
    Loader2,
    MapPin,
    Building,
    FileSpreadsheet,
    Shield,
    Save,
    CheckCircle2,
    Calculator
} from 'lucide-react';
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
        email: '',
        phone: '',
        // Endereço
        zip_code: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        city_code: '',
        // Fiscal
        municipal_registration: '',
        op_simples_nacional: 1,
        apuracao_sn: '',
        regime_especial_tributacao: 0,
        incentivo_fiscal: false,
        rps_last_lote: 0,
        rps_series: '1',
        rps_last_number: 0,
        city_hall_login: '',
        city_hall_password: '',
        fiscal_driver: 'acbr',
    });

    const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
    const [isSearchingCep, setIsSearchingCep] = useState(false);
    const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Consulta CNPJ
    const handleSearchCnpj = async () => {
        const clean = data.cnpj.replace(/\D/g, '');
        if (clean.length !== 14) {
            setFeedback({ text: 'Informe um CNPJ válido com 14 dígitos.', type: 'error' });
            return;
        }

        setIsSearchingCnpj(true);
        setFeedback(null);
        try {
            const res = await lookupService.fetchCnpj(clean);
            setData({
                ...data,
                name: res.companyName || res.name,
                trade_name: res.tradeName || '',
                street: res.address?.street || '',
                number: res.address?.number || '',
                complement: res.address?.complement || '',
                neighborhood: res.address?.neighborhood || '',
                city: res.address?.city || '',
                state: res.address?.state || '',
                zip_code: res.address?.zipCode || '',
                city_code: res.address?.ibgeCode || '',
                op_simples_nacional: res.taxStatus === 'simples_nacional' ? 3 : 1,
            });
            setFeedback({ text: `Dados cadastrais e endereço preenchidos via ${res.source}!`, type: 'success' });
        } catch (err: any) {
            setFeedback({ text: err.message || 'Falha ao consultar CNPJ.', type: 'error' });
        } finally {
            setIsSearchingCnpj(false);
        }
    };

    // Consulta CEP
    const handleSearchCep = async () => {
        const clean = data.zip_code.replace(/\D/g, '');
        if (clean.length !== 8) {
            setFeedback({ text: 'Informe um CEP válido com 8 dígitos.', type: 'error' });
            return;
        }

        setIsSearchingCep(true);
        try {
            const res = await lookupService.fetchCep(clean);
            setData({
                ...data,
                street: res.street,
                neighborhood: res.neighborhood,
                city: res.city,
                state: res.state,
                city_code: res.ibgeCode || res.ibge,
            });
            setFeedback({ text: `Endereço preenchido via ${res.source}!`, type: 'success' });
        } catch (err: any) {
            setFeedback({ text: err.message || 'Falha ao consultar CEP.', type: 'error' });
        } finally {
            setIsSearchingCep(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/management/companies');
    };

    return (
        <AppLayout>
            <Head title="Cadastrar Nova Empresa Cliente" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <Link
                        href="/management/companies"
                        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Voltar às Empresas</span>
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Nova Empresa Emitente</h1>
                    <p className="text-sm text-slate-500">
                        Cadastro completo com dados fiscais, tributários, endereço e controle de RPS
                    </p>
                </div>

                {feedback && (
                    <div className={`p-4 rounded-xl text-xs font-semibold ${
                        feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                        {feedback.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Seção 1: Vínculo com Escritório */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                            <Building className="w-4 h-4 text-emerald-600" />
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                Escritório Contábil Responsável
                            </h2>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Selecione o Escritório *
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
                            {errors.office_id && <p className="text-[11px] text-red-600 mt-1">{errors.office_id}</p>}
                        </div>
                    </div>

                    {/* Seção 2: Identificação da Empresa */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                            <Building2 className="w-4 h-4 text-emerald-600" />
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                Identificação Cadastral da Empresa
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shrink-0 flex items-center space-x-1"
                                    >
                                        {isSearchingCnpj ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                                        <span>Consultar</span>
                                    </button>
                                </div>
                                {errors.cnpj && <p className="text-[11px] text-red-600 mt-1">{errors.cnpj}</p>}
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
                                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail Principal</label>
                                <input
                                    type="email"
                                    placeholder="fiscal@empresa.com.br"
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

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Inscrição Municipal</label>
                                <input
                                    type="text"
                                    placeholder="Ex: 1234567-8"
                                    value={data.municipal_registration}
                                    onChange={(e) => setData('municipal_registration', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Seção 3: Endereço da Sede */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                            <MapPin className="w-4 h-4 text-emerald-600" />
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                Endereço da Sede (Prestador)
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <div className="md:col-span-2">
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

                            <div className="md:col-span-3">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Logradouro / Rua</label>
                                <input
                                    type="text"
                                    value={data.street}
                                    onChange={(e) => setData('street', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Número</label>
                                <input
                                    type="text"
                                    value={data.number}
                                    onChange={(e) => setData('number', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Bairro</label>
                                <input
                                    type="text"
                                    value={data.neighborhood}
                                    onChange={(e) => setData('neighborhood', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Município</label>
                                <input
                                    type="text"
                                    value={data.city}
                                    onChange={(e) => setData('city', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">UF</label>
                                <input
                                    type="text"
                                    maxLength={2}
                                    value={data.state}
                                    onChange={(e) => setData('state', e.target.value.toUpperCase())}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                                />
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Cód. IBGE</label>
                                <input
                                    type="text"
                                    value={data.city_code}
                                    onChange={(e) => setData('city_code', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                />
                            </div>

                            <div className="md:col-span-6">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Complemento</label>
                                <input
                                    type="text"
                                    placeholder="Sala, Andar, Bloco..."
                                    value={data.complement}
                                    onChange={(e) => setData('complement', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Seção 4: Regime Tributário */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                            <Calculator className="w-4 h-4 text-emerald-600" />
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                Regime Tributário e Enquadramento Fiscal
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Opção pelo Simples Nacional *
                                </label>
                                <select
                                    value={data.op_simples_nacional}
                                    onChange={(e) => setData('op_simples_nacional', parseInt(e.target.value, 10))}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value={1}>1 - Não Optante (Lucro Presumido / Real)</option>
                                    <option value={2}>2 - Optante MEI (Microempreendedor Individual)</option>
                                    <option value={3}>3 - Optante ME/EPP (Simples Nacional)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Regime Especial de Tributação
                                </label>
                                <select
                                    value={data.regime_especial_tributacao}
                                    onChange={(e) => setData('regime_especial_tributacao', parseInt(e.target.value, 10))}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value={0}>0 - Nenhum</option>
                                    <option value={1}>1 - Cooperativa</option>
                                    <option value={2}>2 - Estimativa</option>
                                    <option value={3}>3 - Microempresa Municipal</option>
                                    <option value={4}>4 - Notário ou Registrador</option>
                                    <option value={5}>5 - Profissional Autônomo</option>
                                    <option value={6}>6 - Sociedade de Profissionais (Uniprofissional)</option>
                                </select>
                            </div>

                            <div className="md:col-span-2 flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="incentivo_fiscal"
                                    checked={data.incentivo_fiscal}
                                    onChange={(e) => setData('incentivo_fiscal', e.target.checked)}
                                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                                />
                                <label htmlFor="incentivo_fiscal" className="text-xs font-medium text-slate-700">
                                    Possui Incentivo Fiscal Municipal (Lei de Incentivo)
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Seção 5: Controle de RPS e Provedor */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                            <Shield className="w-4 h-4 text-emerald-600" />
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                Parâmetros de Emissão, RPS e Provedor
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Último Lote RPS</label>
                                <input
                                    type="number"
                                    value={data.rps_last_lote}
                                    onChange={(e) => setData('rps_last_lote', parseInt(e.target.value, 10) || 0)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Série RPS</label>
                                <input
                                    type="text"
                                    value={data.rps_series}
                                    onChange={(e) => setData('rps_series', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Último Número RPS</label>
                                <input
                                    type="number"
                                    value={data.rps_last_number}
                                    onChange={(e) => setData('rps_last_number', parseInt(e.target.value, 10) || 0)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Provedor Fiscal</label>
                                <select
                                    value={data.fiscal_driver}
                                    onChange={(e) => setData('fiscal_driver', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="acbr">ACBr API (Padrão Nacional)</option>
                                    <option value="mock">Mock (Ambiente de Testes)</option>
                                    <option value="crawler">Crawler Municipal</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all shadow-md shadow-emerald-600/20"
                        >
                            <Save className="w-4 h-4" />
                            <span>Cadastrar Empresa</span>
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
