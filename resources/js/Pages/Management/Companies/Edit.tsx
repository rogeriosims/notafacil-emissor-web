import React, { useState } from 'react';
import AppLayout from '../../../Layouts/AppLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import {
    Building2,
    ArrowLeft,
    Search,
    Loader2,
    MapPin,
    FileSpreadsheet,
    Shield,
    Save,
    CheckCircle2,
    AlertCircle,
    Key,
    Lock,
    UploadCloud,
    Users,
    Cloud,
    CloudCog,
    Trash2
} from 'lucide-react';
import { lookupService } from '../../../services/lookupService';

interface Office {
    id: string;
    name: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface CertificateInfo {
    id: string;
    expires_at: string;
    is_valid: boolean;
    created_at: string;
    issuer_info?: string | null;
}

interface Company {
    id: string;
    office_id: string;
    name: string;
    cnpj: string;
    trade_name: string | null;
    email: string | null;
    phone: string | null;
    zip_code: string | null;
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    city_code: string | null;
    municipal_registration: string | null;
    op_simples_nacional: number | null;
    apuracao_sn: number | null;
    regime_especial_tributacao: number | null;
    incentivo_fiscal: boolean;
    rps_last_lote: number | null;
    rps_series: string | null;
    rps_last_number: number | null;
    city_hall_login: string | null;
    city_hall_password: string | null;
    fiscal_driver: string | null;
    office?: Office | null;
    users?: User[];
    certificate?: CertificateInfo | null;
}

interface Props {
    company: Company;
    offices: Office[];
}

export default function Edit({ company, offices }: Props) {
    const [activeTab, setActiveTab] = useState<'general' | 'address' | 'fiscal' | 'certificate' | 'team'>('general');
    const [isSearchingCep, setIsSearchingCep] = useState(false);

    // Form Principal de Dados da Empresa
    const { data, setData, put, processing, errors } = useForm({
        office_id: company.office_id || offices[0]?.id || '',
        name: company.name || '',
        cnpj: company.cnpj || '',
        trade_name: company.trade_name || '',
        email: company.email || '',
        phone: company.phone || '',
        // Endereço
        zip_code: company.zip_code || '',
        street: company.street || '',
        number: company.number || '',
        complement: company.complement || '',
        neighborhood: company.neighborhood || '',
        city: company.city || '',
        state: company.state || '',
        city_code: company.city_code || '',
        // Fiscal
        municipal_registration: company.municipal_registration || '',
        op_simples_nacional: company.op_simples_nacional ?? 1,
        apuracao_sn: company.apuracao_sn ?? '',
        regime_especial_tributacao: company.regime_especial_tributacao ?? 0,
        incentivo_fiscal: Boolean(company.incentivo_fiscal),
        rps_last_lote: company.rps_last_lote ?? 0,
        rps_series: company.rps_series || '1',
        rps_last_number: company.rps_last_number ?? 0,
        city_hall_login: company.city_hall_login || '',
        city_hall_password: company.city_hall_password || '',
        fiscal_driver: company.fiscal_driver || 'acbr',
    });

    // Form de Upload de Certificado A1
    const [certFile, setCertFile] = useState<File | null>(null);
    const [certPassword, setCertPassword] = useState('');
    const [isUploadingCert, setIsUploadingCert] = useState(false);
    const [certError, setCertError] = useState<string | null>(null);
    const [certSuccess, setCertSuccess] = useState<string | null>(null);

    const handleCepSearch = async () => {
        const cleanCep = data.zip_code.replace(/\D/g, '');
        if (cleanCep.length !== 8) return;

        setIsSearchingCep(true);
        try {
            const res = await lookupService.lookupCep(cleanCep);
            if (res.found) {
                setData(prev => ({
                    ...prev,
                    street: res.street || prev.street,
                    neighborhood: res.neighborhood || prev.neighborhood,
                    city: res.city || prev.city,
                    state: res.state || prev.state,
                    city_code: res.ibge_code || prev.city_code
                }));
            }
        } finally {
            setIsSearchingCep(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('management.companies.update', company.id));
    };

    const handleUploadCertificate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!certFile || !certPassword) return;

        setIsUploadingCert(true);
        setCertError(null);
        setCertSuccess(null);

        const formData = new FormData();
        formData.append('certificate', certFile);
        formData.append('password', certPassword);

        router.post(route('management.companies.certificate', company.id), formData, {
            onSuccess: () => {
                setCertSuccess('Certificado Digital A1 instalado com sucesso!');
                setCertFile(null);
                setCertPassword('');
                setIsUploadingCert(false);
            },
            onError: (errs) => {
                setCertError(errs.certificate || 'Erro ao processar certificado A1.');
                setIsUploadingCert(false);
            }
        });
    };

    const isCertificateValid = company.certificate?.is_valid;

    return (
        <AppLayout>
            <Head title={`Editar: ${company.name}`} />

            <div className="max-w-6xl mx-auto space-y-6 pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('management.companies.index')}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    isCertificateValid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                    {isCertificateValid ? 'Certificado Ativo' : 'Pendente Certificado'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                <span>CNPJ: {company.cnpj}</span>
                                <span>•</span>
                                <span>Escritório: {company.office?.name || 'Não vinculado'}</span>
                                <span>•</span>
                                <span className="capitalize">Driver: {company.fiscal_driver || 'acbr'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all"
                        >
                            {processing ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Salvar Alterações
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Abas de Navegação */}
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setActiveTab('general')}
                            className={`whitespace-nowrap flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'general'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <Building2 size={18} />
                            Dados Gerais
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('address')}
                            className={`whitespace-nowrap flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'address'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <MapPin size={18} />
                            Endereço & Sede
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('fiscal')}
                            className={`whitespace-nowrap flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'fiscal'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <FileSpreadsheet size={18} />
                            Fiscal & Tributação
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('certificate')}
                            className={`whitespace-nowrap flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'certificate'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <Shield size={18} />
                            Certificado Digital A1
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('team')}
                            className={`whitespace-nowrap flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'team'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <Users size={18} />
                            Equipe & Usuários ({company.users?.length || 0})
                        </button>
                    </nav>
                </div>

                {/* Conteúdo da Aba 1: Dados Gerais */}
                {activeTab === 'general' && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
                            Informações Cadastrais da Empresa
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Escritório Contábil Responsável *
                                </label>
                                <select
                                    value={data.office_id}
                                    onChange={e => setData('office_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    {offices.map(o => (
                                        <option key={o.id} value={o.id}>{o.name}</option>
                                    ))}
                                </select>
                                {errors.office_id && <p className="text-xs text-red-600 mt-1">{errors.office_id}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    CNPJ (Fixo / Inalterável)
                                </label>
                                <input
                                    type="text"
                                    value={data.cnpj}
                                    disabled
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Razão Social *
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nome Fantasia
                                </label>
                                <input
                                    type="text"
                                    value={data.trade_name}
                                    onChange={e => setData('trade_name', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    E-mail Financeiro / Fiscal
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Telefone / WhatsApp
                                </label>
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={e => setData('phone', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Conteúdo da Aba 2: Endereço & Sede */}
                {activeTab === 'address' && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Endereço da Empresa</h2>
                                <p className="text-xs text-slate-500">Dados oficiais informados na DPS e no RPS da Prefeitura.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    CEP
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={data.zip_code}
                                        onChange={e => setData('zip_code', e.target.value)}
                                        onBlur={handleCepSearch}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCepSearch}
                                        disabled={isSearchingCep}
                                        className="absolute right-1 top-1 bottom-1 px-2.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded"
                                    >
                                        {isSearchingCep ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="md:col-span-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Logradouro (Rua, Avenida, etc.)
                                </label>
                                <input
                                    type="text"
                                    value={data.street}
                                    onChange={e => setData('street', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Número
                                </label>
                                <input
                                    type="text"
                                    value={data.number}
                                    onChange={e => setData('number', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Complemento
                                </label>
                                <input
                                    type="text"
                                    value={data.complement}
                                    onChange={e => setData('complement', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Bairro
                                </label>
                                <input
                                    type="text"
                                    value={data.neighborhood}
                                    onChange={e => setData('neighborhood', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Cidade
                                </label>
                                <input
                                    type="text"
                                    value={data.city}
                                    onChange={e => setData('city', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    UF
                                </label>
                                <input
                                    type="text"
                                    maxLength={2}
                                    value={data.state}
                                    onChange={e => setData('state', e.target.value.toUpperCase())}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Código IBGE do Município
                                </label>
                                <input
                                    type="text"
                                    value={data.city_code}
                                    onChange={e => setData('city_code', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Conteúdo da Aba 3: Fiscal & Tributação */}
                {activeTab === 'fiscal' && (
                    <div className="space-y-6">
                        {/* Motor Fiscal & Provedor */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
                                Driver & Motor de Emissão Fiscal
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Provedor de Emissão (Hexagonal / Agnóstico)
                                    </label>
                                    <select
                                        value={data.fiscal_driver}
                                        onChange={e => setData('fiscal_driver', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="acbr">ACBr API (Recomendado / Nuvem Fiscal)</option>
                                        <option value="crawler">Crawler Municipal (Robô Puppeteer)</option>
                                        <option value="mock">Ambiente de Simulação / Mock Fiscal</option>
                                    </select>
                                    <p className="text-xs text-slate-500 mt-1">
                                        O FiscalFlow roteia o envio de RPS automaticamente pelo driver selecionado.
                                    </p>
                                </div>

                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.incentivo_fiscal}
                                            onChange={e => setData('incentivo_fiscal', e.target.checked)}
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-slate-900">Possui Incentivo Fiscal Municipal?</span>
                                            <p className="text-xs text-slate-500">Marque se a empresa possui benefício fiscal aprovado pela Prefeitura.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Regime Tributário */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
                                Enquadramento e Regime Tributário
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Opção pelo Simples Nacional *
                                    </label>
                                    <select
                                        value={data.op_simples_nacional}
                                        onChange={e => setData('op_simples_nacional', Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value={1}>1 - Não Optante (Lucro Presumido/Real)</option>
                                        <option value={2}>2 - Optante - MEI</option>
                                        <option value={3}>3 - Optante - ME ou EPP</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Regime de Apuração no SN
                                    </label>
                                    <select
                                        value={data.apuracao_sn}
                                        disabled={Number(data.op_simples_nacional) !== 3}
                                        onChange={e => setData('apuracao_sn', e.target.value ? Number(e.target.value) : '')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                                    >
                                        <option value="">Padrão Nacional (Nenhum)</option>
                                        <option value={1}>1 – Tributos federais e municipal pelo SN</option>
                                        <option value={2}>2 – Tributos federais pelo SN e ISS por fora</option>
                                        <option value={3}>3 – Tributos federais e municipal por fora</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Regime Especial de Tributação
                                    </label>
                                    <select
                                        value={data.regime_especial_tributacao}
                                        onChange={e => setData('regime_especial_tributacao', Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value={0}>0 - Nenhum / Operação Regular</option>
                                        <option value={1}>1 - Cooperativa</option>
                                        <option value={2}>2 - Estimativa</option>
                                        <option value={3}>3 - Microempresa Municipal</option>
                                        <option value={4}>4 - Notário ou Registrador</option>
                                        <option value={5}>5 - Profissional Autônomo</option>
                                        <option value={6}>6 - Sociedade Uniprofissional</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* RPS e Integração com a Prefeitura */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
                                Controle de RPS & Credenciais do Portal Municipal
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Inscrição Municipal (CCM)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.municipal_registration}
                                        onChange={e => setData('municipal_registration', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Série do RPS
                                    </label>
                                    <input
                                        type="text"
                                        value={data.rps_series}
                                        onChange={e => setData('rps_series', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Último Número Emitido
                                    </label>
                                    <input
                                        type="number"
                                        value={data.rps_last_number}
                                        onChange={e => setData('rps_last_number', Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Último Lote Enviado
                                    </label>
                                    <input
                                        type="number"
                                        value={data.rps_last_lote}
                                        onChange={e => setData('rps_last_lote', Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Login no Portal da Prefeitura
                                    </label>
                                    <input
                                        type="text"
                                        value={data.city_hall_login}
                                        onChange={e => setData('city_hall_login', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Senha do Portal da Prefeitura
                                    </label>
                                    <input
                                        type="password"
                                        value={data.city_hall_password}
                                        onChange={e => setData('city_hall_password', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Conteúdo da Aba 4: Certificado Digital A1 */}
                {activeTab === 'certificate' && (
                    <div className="space-y-6">
                        {/* Status Atual do Certificado */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                                <span>Status do Certificado Digital A1</span>
                                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                                    isCertificateValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {isCertificateValid ? 'Certificado Instalado & Válido' : 'Certificado Não Instalado ou Expirado'}
                                </span>
                            </h2>

                            {company.certificate ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold">Data de Expiração</p>
                                        <p className="text-base font-bold text-slate-900 mt-1">
                                            {company.certificate.expires_at || 'Indisponível'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold">Data da Instalação</p>
                                        <p className="text-base font-medium text-slate-700 mt-1">
                                            {company.certificate.created_at || 'Indisponível'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold">Criptografia em Repouso</p>
                                        <p className="text-sm font-medium text-green-700 mt-1 flex items-center gap-1.5">
                                            <Lock size={14} /> AES-256 (Padrão Bancário)
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-3">
                                    <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-600" />
                                    <div>
                                        <p className="font-semibold">Nenhum certificado A1 instalado para esta empresa.</p>
                                        <p className="text-xs mt-1">
                                            Para assinar e emitir notas fiscais pelo motor ACBr ou transmitir lotes à prefeitura, envie o arquivo .PFX ou .P12 abaixo.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Formulário de Upload */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                                <UploadCloud size={20} className="text-blue-600" />
                                Instalar Novo Certificado Digital (.PFX ou .P12)
                            </h2>

                            {certSuccess && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center gap-2">
                                    <CheckCircle2 size={18} className="text-green-600" />
                                    {certSuccess}
                                </div>
                            )}

                            {certError && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-center gap-2">
                                    <AlertCircle size={18} className="text-red-600" />
                                    {certError}
                                </div>
                            )}

                            <form onSubmit={handleUploadCertificate} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Arquivo do Certificado (.pfx ou .p12) *
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pfx,.p12"
                                            onChange={e => setCertFile(e.target.files?.[0] || null)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Senha do Certificado *
                                        </label>
                                        <input
                                            type="password"
                                            value={certPassword}
                                            onChange={e => setCertPassword(e.target.value)}
                                            placeholder="Digite a senha do arquivo PFX"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={!certFile || !certPassword || isUploadingCert}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
                                    >
                                        {isUploadingCert ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Validando e Criptografando...
                                            </>
                                        ) : (
                                            <>
                                                <Shield size={16} />
                                                Validar e Salvar Certificado
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Conteúdo da Aba 5: Equipe & Usuários */}
                {activeTab === 'team' && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Usuários Vinculados à Empresa</h2>
                                <p className="text-xs text-slate-500">Membros e operadores autorizados a emitir notas e consultar relatórios.</p>
                            </div>
                        </div>

                        {company.users && company.users.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {company.users.map(u => (
                                    <div key={u.id} className="py-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{u.name}</p>
                                            <p className="text-xs text-slate-500">{u.email}</p>
                                        </div>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                            {u.role}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500 text-sm">
                                Nenhum usuário vinculado individualmente a esta empresa.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
