import React, { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    FileText,
    Plus,
    Search,
    Filter,
    Download,
    Copy,
    Ban,
    Eye,
    CheckCircle2,
    Clock,
    XCircle,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { formatCurrency, formatCpfCnpj } from '../../lib/utils';
import axios from 'axios';

interface InvoiceItem {
    id: number;
    number: string | null;
    series: string;
    status: string;
    amount: string;
    net_amount: string;
    borrower_name: string;
    borrower_document: string;
    created_at: string;
    xml_url: string | null;
    pdf_url: string | null;
    tracking_id: string | null;
}

interface PaginatedInvoices {
    data: InvoiceItem[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface Props {
    invoices: PaginatedInvoices;
    filters?: {
        search?: string;
        status?: string;
    };
}

export default function Index({ invoices, filters = {} }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [cancelModalInvoice, setCancelModalInvoice] = useState<InvoiceItem | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    const [actionFeedback, setActionFeedback] = useState<string | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/invoices', {
            search: searchTerm,
            status: statusFilter,
        }, { preserveState: true });
    };

    const handleStatusClick = (status: string) => {
        const newStatus = statusFilter === status ? '' : status;
        setStatusFilter(newStatus);
        router.get('/invoices', {
            search: searchTerm,
            status: newStatus,
        }, { preserveState: true });
    };

    const handleDuplicate = async (invoiceId: number) => {
        try {
            const resp = await axios.post(`/api/invoices/${invoiceId}/duplicate`);
            setActionFeedback('Nota fiscal duplicada com sucesso!');
            setTimeout(() => {
                router.visit('/invoices');
            }, 800);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao duplicar nota fiscal.');
        }
    };

    const handleConfirmCancel = async () => {
        if (!cancelModalInvoice || !cancelReason) return;
        setIsCancelling(true);
        try {
            await axios.post(`/api/invoices/${cancelModalInvoice.id}/cancel`, {
                reason: cancelReason,
            });
            setCancelModalInvoice(null);
            setCancelReason('');
            router.reload();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao cancelar nota.');
        } finally {
            setIsCancelling(false);
        }
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'AUTHORIZED':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                        Autorizada
                    </span>
                );
            case 'PROCESSING':
            case 'DRAFT':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <Loader2 className="w-3 h-3 animate-spin mr-1.5 text-blue-500" />
                        {status === 'DRAFT' ? 'Rascunho' : 'Processando'}
                    </span>
                );
            case 'CANCELED':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
                        Cancelada
                    </span>
                );
            case 'ERROR':
            case 'REJECTED':
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                        <XCircle className="w-3 h-3 mr-1.5 text-red-500" />
                        Rejeitada
                    </span>
                );
        }
    };

    return (
        <AppLayout>
            <Head title="Notas Fiscais de Serviço" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Notas Fiscais de Serviço</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Gerencie as notas emitidas, consulte status em tempo real e realize cancelamentos
                        </p>
                    </div>

                    <Link
                        href="/invoices/create"
                        className="inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm shadow-emerald-600/20 transition-all self-start sm:self-auto"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nova Emissão</span>
                    </Link>
                </div>

                {actionFeedback && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium animate-in fade-in">
                        {actionFeedback}
                    </div>
                )}

                {/* Filtros e Busca */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por número da nota, nome do tomador ou CPF/CNPJ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5"
                            >
                                <Filter className="w-3.5 h-3.5" />
                                <span>Filtrar</span>
                            </button>

                            {(searchTerm || statusFilter) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setStatusFilter('');
                                        router.get('/invoices');
                                    }}
                                    className="px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg transition-colors"
                                >
                                    Limpar
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Tags Rápidas de Status */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
                        {['AUTHORIZED', 'PROCESSING', 'CANCELED', 'ERROR'].map((st) => (
                            <button
                                key={st}
                                type="button"
                                onClick={() => handleStatusClick(st)}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                                    statusFilter === st
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {st === 'AUTHORIZED' && 'Autorizadas'}
                                {st === 'PROCESSING' && 'Em Processamento'}
                                {st === 'CANCELED' && 'Canceladas'}
                                {st === 'ERROR' && 'Rejeitadas'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tabela de Notas */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-left">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-3.5">Número / Série</th>
                                    <th className="px-6 py-3.5">Tomador do Serviço</th>
                                    <th className="px-6 py-3.5">Emissão</th>
                                    <th className="px-6 py-3.5">Valor Bruto</th>
                                    <th className="px-6 py-3.5">Líquido</th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {invoices?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                            <p className="font-medium text-slate-600">Nenhuma nota fiscal encontrada</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Altere os filtros de busca ou emita uma nova NFS-e
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.data.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap font-mono font-semibold text-slate-800">
                                                {inv.number ? (
                                                    <span className="text-emerald-700">Nº {inv.number}</span>
                                                ) : (
                                                    <span className="text-slate-400 italic">DPS Em Fila</span>
                                                )}
                                                <span className="block text-[10px] text-slate-400 font-normal">Série {inv.series}</span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800 max-w-xs truncate">
                                                    {inv.borrower_name}
                                                </div>
                                                <div className="text-[11px] text-slate-400 font-mono">
                                                    {formatCpfCnpj(inv.borrower_document)}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                                {inv.created_at}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-800">
                                                R$ {inv.amount}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-emerald-700">
                                                R$ {inv.net_amount}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {renderStatusBadge(inv.status)}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end space-x-1">
                                                    <Link
                                                        href={`/invoices/${inv.id}`}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                                        title="Ver Detalhes e Espelho"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDuplicate(inv.id)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                        title="Duplicar para Nova Emissão"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>

                                                    {inv.status === 'AUTHORIZED' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setCancelModalInvoice(inv)}
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                            title="Cancelar NFS-e"
                                                        >
                                                            <Ban className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginação */}
                    {invoices?.total > 0 && (
                        <div className="px-6 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <div>
                                Mostrando <strong>{invoices.from}</strong> a <strong>{invoices.to}</strong> de <strong>{invoices.total}</strong> registros
                            </div>

                            <div className="flex items-center space-x-1">
                                {invoices.prev_page_url ? (
                                    <Link
                                        href={invoices.prev_page_url}
                                        className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </Link>
                                ) : (
                                    <span className="p-1.5 rounded border border-slate-200 bg-slate-100 text-slate-300">
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </span>
                                )}

                                {invoices.next_page_url ? (
                                    <Link
                                        href={invoices.next_page_url}
                                        className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                                    >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </Link>
                                ) : (
                                    <span className="p-1.5 rounded border border-slate-200 bg-slate-100 text-slate-300">
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Confirmação de Cancelamento */}
            {cancelModalInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4">
                        <div className="flex items-center space-x-3 text-red-600">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <Ban className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-base">Cancelar Nota Fiscal</h3>
                                <p className="text-xs text-slate-500">NFS-e Nº {cancelModalInvoice.number || cancelModalInvoice.id}</p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600">
                            Tem certeza que deseja solicitar o cancelamento desta NFS-e junto à Prefeitura/SEFAZ? Esta ação é definitiva e não pode ser desfeita.
                        </p>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Motivo do Cancelamento *
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Informe a justificativa exigida pelo fisco..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                required
                            />
                        </div>

                        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setCancelModalInvoice(null)}
                                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                Manter Nota
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmCancel}
                                disabled={isCancelling || !cancelReason}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5"
                            >
                                {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                                <span>Confirmar Cancelamento</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
