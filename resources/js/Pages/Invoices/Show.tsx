import React, { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    FileText,
    ArrowLeft,
    Download,
    Copy,
    Ban,
    CheckCircle2,
    Building2,
    UserCheck,
    Receipt,
    Clock,
    AlertTriangle,
    ShieldCheck
} from 'lucide-react';
import { formatCurrency, formatCpfCnpj } from '../../lib/utils';
import axios from 'axios';

interface Props {
    invoice: {
        id: number;
        number: string | null;
        series: string;
        status: string;
        service_amount: string;
        net_amount: string;
        created_at: string;
        borrower?: {
            name?: string;
            tax_id?: string;
            email?: string;
            address?: any;
        };
        iss?: {
            rate?: number;
            value?: number;
            withheld?: boolean;
        };
        federals?: {
            irrf?: number;
            csrf?: number;
            inss?: number;
            pis?: number;
            cofins?: number;
            csll?: number;
            dispensed_by_adr005?: boolean;
        };
        xml_url: string | null;
        pdf_url: string | null;
        tracking_id: string | null;
        cancellation_reason?: string | null;
        cancelled_at?: string | null;
    };
}

export default function Show({ invoice }: Props) {
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    const handleDuplicate = async () => {
        try {
            await axios.post(`/api/invoices/${invoice.id}/duplicate`);
            router.visit('/invoices');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao duplicar nota.');
        }
    };

    return (
        <AppLayout>
            <Head title={`NFS-e Nº ${invoice.number || invoice.id}`} />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Top Navigation & Status Bar */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/invoices"
                        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Voltar para Lista de Notas</span>
                    </Link>

                    <div className="flex items-center space-x-2">
                        {invoice.status === 'AUTHORIZED' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                                NFS-e Autorizada
                            </span>
                        )}
                        {invoice.status === 'CANCELED' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                                <Ban className="w-3.5 h-3.5 mr-1.5 text-red-600" />
                                Cancelada
                            </span>
                        )}
                    </div>
                </div>

                {/* Card de Espelho Oficial da Nota */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Header do Espelho */}
                    <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 block mb-1">
                                Nota Fiscal de Serviços Eletrônica (NFS-e Padrão Nacional)
                            </span>
                            <h1 className="text-xl font-black tracking-tight">
                                {invoice.number ? `NFS-e Nº ${invoice.number}` : `DPS Em Fila de Processamento`}
                            </h1>
                            <p className="text-xs text-slate-400 mt-1">
                                Série: {invoice.series} | Data/Hora de Emissão: {invoice.created_at}
                            </p>
                        </div>

                        {invoice.tracking_id && (
                            <div className="text-right font-mono text-xs bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700">
                                <span className="block text-[10px] text-slate-400 uppercase font-sans">Protocolo / Tracking ID</span>
                                <span className="text-emerald-400 font-bold">{invoice.tracking_id}</span>
                            </div>
                        )}
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Tomador do Serviço */}
                        <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/60">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-1.5">
                                <UserCheck className="w-4 h-4 text-emerald-600" />
                                <span>Dados do Tomador do Serviço (Cliente)</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <span className="text-slate-400 block">Razão Social / Nome:</span>
                                    <span className="font-bold text-slate-800 text-sm">{invoice.borrower?.name || 'Não informado'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">CPF / CNPJ:</span>
                                    <span className="font-mono font-semibold text-slate-700">
                                        {formatCpfCnpj(invoice.borrower?.tax_id || '')}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">E-mail:</span>
                                    <span className="text-slate-700">{invoice.borrower?.email || 'Não informado'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quadro de Valores e Tributos */}
                        <div className="border border-slate-200 rounded-xl p-5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-1.5">
                                <Receipt className="w-4 h-4 text-emerald-600" />
                                <span>Detalhamento Tributário e Apuração</span>
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-400 block">Valor Bruto dos Serviços</span>
                                    <span className="text-base font-bold text-slate-900">R$ {invoice.service_amount}</span>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-400 block">ISS ({invoice.iss?.rate || 2}%)</span>
                                    <span className="text-base font-bold text-slate-800">
                                        {formatCurrency(invoice.iss?.value || 0)}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">
                                        {invoice.iss?.withheld ? 'Retido na Fonte' : 'Devido pelo Prestador'}
                                    </span>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-400 block">Retenções Federais</span>
                                    <span className="text-base font-bold text-slate-800">
                                        {formatCurrency((invoice.federals?.irrf || 0) + (invoice.federals?.csrf || 0) + (invoice.federals?.inss || 0))}
                                    </span>
                                    {invoice.federals?.dispensed_by_adr005 && (
                                        <span className="text-[10px] text-emerald-600 block font-semibold">ADR 005 (≤ R$ 10)</span>
                                    )}
                                </div>

                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                    <span className="text-emerald-700 font-semibold block">Valor Líquido da Nota</span>
                                    <span className="text-base font-black text-emerald-800">R$ {invoice.net_amount}</span>
                                </div>
                            </div>
                        </div>

                        {/* Motivo do Cancelamento (se houver) */}
                        {invoice.cancellation_reason && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                                <span className="font-bold block mb-1">Motivo do Cancelamento Registrado no Fisco:</span>
                                <p>{invoice.cancellation_reason}</p>
                                <span className="text-[11px] text-red-500 mt-2 block">Cancelada em: {invoice.cancelled_at}</span>
                            </div>
                        )}
                    </div>

                    {/* Barra de Ações do Rodapé */}
                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center space-x-2">
                            {invoice.xml_url && (
                                <a
                                    href={invoice.xml_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Download XML</span>
                                </a>
                            )}

                            {invoice.pdf_url && (
                                <a
                                    href={invoice.pdf_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Download DANFSE (PDF)</span>
                                </a>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                type="button"
                                onClick={handleDuplicate}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-colors"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Duplicar Nota</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
