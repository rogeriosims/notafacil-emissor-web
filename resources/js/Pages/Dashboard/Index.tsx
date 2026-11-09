import React from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    TrendingUp,
    CheckCircle2,
    Clock,
    AlertOctagon,
    Plus,
    FileSpreadsheet,
    Settings,
    FileText,
    ArrowUpRight,
    Building2,
    ShieldAlert
} from 'lucide-react';
import { formatCpfCnpj } from '../../lib/utils';

interface MetricData {
    revenue_month: string;
    authorized_count: number;
    processing_count: number;
    error_count: number;
}

interface RecentInvoice {
    id: number;
    number: string | null;
    borrower_name: string;
    borrower_document: string;
    service_amount: string;
    status: string;
    created_at: string;
}

interface Props {
    metrics: MetricData;
    recent_invoices: RecentInvoice[];
    office_data?: {
        companies_count: number;
    } | null;
}

export default function Index({ metrics, recent_invoices, office_data }: Props) {
    const { props } = usePage<any>();
    const user = props.auth?.user;
    const activeCompany = props.active_company;

    return (
        <AppLayout>
            <Head title="Painel de Controle Fiscal" />

            <div className="space-y-8 max-w-7xl mx-auto">
                {/* Header Boas-vindas e Contexto */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Olá, {user?.name?.split(' ')[0] || 'Usuário'}! 👋
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Visão geral da emissão fiscal para <strong className="text-slate-800">{activeCompany?.name || 'sua empresa'}</strong>
                        </p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <Link
                            href="/invoices/create"
                            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm shadow-emerald-600/20 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nova Emissão</span>
                        </Link>
                    </div>
                </div>

                {/* 4 Cards de Métricas Principais (KPIs) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Faturamento do Mês */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Faturamento (Mês)
                            </span>
                            <span className="text-2xl font-black text-slate-900 tracking-tight block">
                                R$ {metrics.revenue_month}
                            </span>
                            <span className="text-[11px] font-medium text-emerald-600 mt-1 inline-flex items-center">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                NFS-e Autorizadas
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Notas Autorizadas */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Autorizadas
                            </span>
                            <span className="text-2xl font-black text-slate-900 tracking-tight block">
                                {metrics.authorized_count}
                            </span>
                            <span className="text-[11px] font-medium text-slate-400 mt-1 block">
                                Transmitidas com sucesso
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Em Processamento */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Em Fila / DPS
                            </span>
                            <span className="text-2xl font-black text-slate-900 tracking-tight block">
                                {metrics.processing_count}
                            </span>
                            <span className="text-[11px] font-medium text-amber-600 mt-1 block">
                                Aguardando lote fiscal
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Rejeições / Erros */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Rejeitadas
                            </span>
                            <span className="text-2xl font-black text-slate-900 tracking-tight block">
                                {metrics.error_count}
                            </span>
                            <span className="text-[11px] font-medium text-red-500 mt-1 block">
                                Necessitam de correção
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                            <AlertOctagon className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Banner de Escritório Contábil (se aplicável) */}
                {office_data && (
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white flex items-center justify-between shadow-md">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 font-bold">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider block">
                                    Modo Escritório Contábil
                                </span>
                                <h3 className="text-base font-bold">
                                    Você gerencia {office_data.companies_count} empresa(s) cliente(s)
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Alterne de empresa a qualquer momento no seletor do topo
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/companies/settings"
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                            Gerenciar Certificados
                        </Link>
                    </div>
                )}

                {/* Grid Inferior: Atividade Recente e Ações Rápidas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Tabela de Últimas Notas Emitidas (2 colunas) */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-emerald-600" />
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                    Últimas Notas Emitidas
                                </h2>
                            </div>
                            <Link
                                href="/invoices"
                                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
                            >
                                <span>Ver todas</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {recent_invoices.length === 0 ? (
                            <div className="py-12 text-center text-slate-400">
                                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                <p className="font-medium text-slate-600 text-xs">Nenhuma nota emitida ainda</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Clique no botão acima para realizar a primeira emissão de teste
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {recent_invoices.map((inv) => (
                                    <div key={inv.id} className="py-3.5 flex items-center justify-between text-xs">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center font-mono font-bold text-slate-700 text-xs">
                                                {inv.number ? `#${inv.number}` : 'DPS'}
                                            </div>
                                            <div>
                                                <span className="font-semibold text-slate-800 block">
                                                    {inv.borrower_name}
                                                </span>
                                                <span className="text-[11px] text-slate-400 font-mono">
                                                    {formatCpfCnpj(inv.borrower_document)} • {inv.created_at}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className="font-bold text-slate-800 block">
                                                R$ {inv.service_amount}
                                            </span>
                                            <span className="text-[10px] font-semibold text-emerald-600 uppercase">
                                                {inv.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Ações Rápidas (1 coluna) */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-4">
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3">
                                Ações Rápidas
                            </h2>

                            <div className="space-y-2.5">
                                <Link
                                    href="/invoices/create"
                                    className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center space-x-3 transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <span className="font-bold text-xs text-slate-800 block">Emitir NFS-e Rápida</span>
                                        <span className="text-[11px] text-slate-400 block">Com preenchimento automático</span>
                                    </div>
                                </Link>

                                <Link
                                    href="/batches"
                                    className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center space-x-3 transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <FileSpreadsheet className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <span className="font-bold text-xs text-slate-800 block">Importação por Planilha</span>
                                        <span className="text-[11px] text-slate-400 block">Envio em lote assíncrono</span>
                                    </div>
                                </Link>

                                <Link
                                    href="/companies/settings"
                                    className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center space-x-3 transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <Settings className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <span className="font-bold text-xs text-slate-800 block">Certificado e Dados</span>
                                        <span className="text-[11px] text-slate-400 block">Configurar A1 e tributos</span>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
