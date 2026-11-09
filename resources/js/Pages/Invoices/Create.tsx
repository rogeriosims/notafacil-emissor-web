import React, { useState, useEffect } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Building2,
    Calculator,
    UserCheck,
    PlusCircle,
    Info,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Send
} from 'lucide-react';
import BorrowerQuickCreateModal, { BorrowerData } from '../../Components/issuance/BorrowerQuickCreateModal';
import { lookupService } from '../../services/lookupService';
import { formatCurrency } from '../../lib/utils';

interface ServiceItem {
    id: number;
    service_code: string;
    description: string;
    default_rate: number;
}

interface Customer {
    id: number;
    name: string;
    tax_id: string;
    email?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    city_code?: string;
    state?: string;
    zip_code?: string;
}

interface Props {
    company: {
        id: number;
        name: string;
        hasCertificate: boolean;
        fiscal_driver: string;
    } | null;
    services: ServiceItem[];
    customers: Customer[];
}

export default function Create({ company, services, customers }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        borrower_document: '',
        borrower_name: '',
        borrower_email: '',
        borrower_address: {} as any,
        service_item_id: services[0]?.id || '',
        description: '',
        amount: '',
        iss_rate: services[0]?.default_rate || 2.0,
        iss_withheld: false,
    });

    const [isBorrowerModalOpen, setIsBorrowerModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [simulation, setSimulation] = useState<any>(null);
    const [isSimulating, setIsSimulating] = useState(false);

    // Seleção de Tomador Cadastrado
    const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const custId = e.target.value;
        if (!custId) {
            setSelectedCustomer(null);
            setData({
                ...data,
                borrower_document: '',
                borrower_name: '',
                borrower_email: '',
                borrower_address: {},
            });
            return;
        }

        const found = customers.find(c => String(c.id) === custId);
        if (found) {
            setSelectedCustomer(found);
            setData({
                ...data,
                borrower_document: found.tax_id,
                borrower_name: found.name,
                borrower_email: found.email || '',
                borrower_address: {
                    street: found.street,
                    number: found.number,
                    neighborhood: found.neighborhood,
                    city_code: found.city_code,
                    state: found.state,
                    zip_code: found.zip_code,
                },
            });
        }
    };

    // Callback quando tomador é criado ou consultado via modal com CNPJ/CEP
    const handleBorrowerCreated = (borrower: BorrowerData) => {
        setData({
            ...data,
            borrower_document: borrower.taxId,
            borrower_name: borrower.name,
            borrower_email: borrower.email || '',
            borrower_address: borrower.address,
        });
    };

    // Quando altera o serviço selecionado
    const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const sId = e.target.value;
        const s = services.find(item => String(item.id) === sId);
        setData({
            ...data,
            service_item_id: sId,
            iss_rate: s ? s.default_rate : 2.0,
        });
    };

    // Debounce da Simulação Fiscal
    useEffect(() => {
        const val = parseFloat(data.amount);
        if (isNaN(val) || val <= 0) {
            setSimulation(null);
            return;
        }

        setIsSimulating(true);
        const timer = setTimeout(async () => {
            try {
                const res = await lookupService.simulateInvoice({
                    amount: val,
                    service_item_id: data.service_item_id,
                    iss_rate: Number(data.iss_rate),
                    iss_withheld: data.iss_withheld,
                });
                setSimulation(res);
            } catch (err) {
                console.error('Falha na simulação fiscal:', err);
            } finally {
                setIsSimulating(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [data.amount, data.service_item_id, data.iss_rate, data.iss_withheld]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/invoices');
    };

    return (
        <AppLayout>
            <Head title="Nova Emissão de NFS-e" />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Nova Emissão de NFS-e</h1>
                        <p className="text-sm text-slate-500">
                            Prestador: <strong className="text-slate-700">{company?.name || 'Empresa Padrão'}</strong>
                        </p>
                    </div>

                    {!company?.hasCertificate && (
                        <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-semibold">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <span>Certificado A1 em modo Mock/Homologação</span>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Formulário Principal (2 colunas) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Seção 1: Tomador */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center space-x-2">
                                    <UserCheck className="w-4 h-4 text-emerald-600" />
                                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                        Tomador do Serviço (Cliente)
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsBorrowerModalOpen(true)}
                                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-colors"
                                >
                                    <PlusCircle className="w-3.5 h-3.5" />
                                    <span>Buscar por CNPJ / Novo Tomador</span>
                                </button>
                            </div>

                            {/* Dropdown de Tomador ou Dados Preenchidos */}
                            {customers.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Selecionar Tomador Existente
                                    </label>
                                    <select
                                        onChange={handleCustomerChange}
                                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">Selecione ou clique em Novo Tomador...</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.tax_id})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        CPF ou CNPJ *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="00.000.000/0000-00"
                                        value={data.borrower_document}
                                        onChange={(e) => setData('borrower_document', e.target.value)}
                                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                    {errors.borrower_document && (
                                        <p className="text-[11px] text-red-600 mt-1">{errors.borrower_document}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Razão Social / Nome Completo *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.borrower_name}
                                        onChange={(e) => setData('borrower_name', e.target.value)}
                                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                    {errors.borrower_name && (
                                        <p className="text-[11px] text-red-600 mt-1">{errors.borrower_name}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Seção 2: Serviço e Discriminação */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                                <Building2 className="w-4 h-4 text-emerald-600" />
                                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                    Serviço Prestado
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Item da Lista de Serviços (LC 116) *
                                    </label>
                                    <select
                                        value={data.service_item_id}
                                        onChange={handleServiceChange}
                                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        {services.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.service_code} - {s.description} ({s.default_rate}%)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Alíquota do ISS (%) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="2"
                                        max="5"
                                        value={data.iss_rate}
                                        onChange={(e) => setData('iss_rate', parseFloat(e.target.value) || 2.0)}
                                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-semibold text-slate-700">
                                        Discriminação dos Serviços *
                                    </label>
                                    <span className="text-[11px] text-slate-400">
                                        Suporta tags: <code className="text-emerald-700">{"{{mes}}"}</code>, <code className="text-emerald-700">{"{{ano}}"}</code>
                                    </span>
                                </div>
                                <textarea
                                    rows={4}
                                    placeholder="Prestação de serviços de assessoria e tecnologia no mês de {{mes}}/{{ano}}..."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                                {errors.description && (
                                    <p className="text-[11px] text-red-600 mt-1">{errors.description}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Valor Total dos Serviços (R$) *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0,00"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-sm font-bold text-slate-800 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                {errors.amount && (
                                    <p className="text-[11px] text-red-600 mt-1">{errors.amount}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Coluna Lateral: Simulação Fiscal & Ações */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center space-x-2">
                                    <Calculator className="w-4 h-4 text-emerald-600" />
                                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                        Apuração Fiscal em Tempo Real
                                    </h3>
                                </div>
                                {isSimulating && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />}
                            </div>

                            {simulation ? (
                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-500">Valor Bruto</span>
                                        <span className="font-semibold text-slate-800">
                                            {formatCurrency(simulation.base_amount)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-500">ISS ({simulation.iss_rate}%)</span>
                                        <span className="font-semibold text-slate-800">
                                            {formatCurrency(simulation.iss_amount)}
                                        </span>
                                    </div>

                                    {/* Retenções Federais */}
                                    <div className="py-2 space-y-1.5 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                                        <span className="block text-[11px] font-bold text-slate-600 uppercase">
                                            Tributos Federais
                                        </span>
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-slate-500">PIS (0,65%)</span>
                                            <span>{formatCurrency(simulation.details?.pis || 0)}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-slate-500">COFINS (3,00%)</span>
                                            <span>{formatCurrency(simulation.details?.cofins || 0)}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-slate-500">CSLL (1,00%)</span>
                                            <span>{formatCurrency(simulation.details?.csll || 0)}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-slate-500">IRRF (1,50%)</span>
                                            <span>{formatCurrency(simulation.irrf_amount)}</span>
                                        </div>

                                        {simulation.adr005_applied && (
                                            <div className="mt-2 pt-1.5 border-t border-slate-200/80 flex items-center space-x-1 text-[10px] text-emerald-700 font-medium">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                <span>ADR 005: Retenções federais dispensadas (valor ≤ R$ 10,00)</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 flex justify-between items-center text-sm font-bold border-t border-slate-200">
                                        <span className="text-slate-900">Líquido a Receber</span>
                                        <span className="text-emerald-700 text-base">
                                            {formatCurrency(simulation.net_amount)}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-8 text-center text-xs text-slate-400">
                                    <Info className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                                    Informe o valor do serviço para simular os tributos
                                </div>
                            )}

                            <div className="pt-4 border-t border-slate-100">
                                <button
                                    type="submit"
                                    disabled={processing || !data.amount || !data.borrower_name}
                                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Processando Emissão...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            <span>Emitir Nota Fiscal</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Modal de Criação / Consulta de Tomador com CNPJ e CEP */}
            <BorrowerQuickCreateModal
                isOpen={isBorrowerModalOpen}
                onClose={() => setIsBorrowerModalOpen(false)}
                onBorrowerCreated={handleBorrowerCreated}
            />
        </AppLayout>
    );
}
