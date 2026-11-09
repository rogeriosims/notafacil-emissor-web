import React from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Layers, Plus, FileSpreadsheet, CheckCircle2, AlertTriangle, Clock, Download } from 'lucide-react';

interface BatchItem {
    id: number;
    file_name: string;
    total_rows: number;
    processed_rows: number;
    success_count: number;
    error_count: number;
    status: string;
    created_at: string;
}

interface Props {
    batches: {
        data: BatchItem[];
        total: number;
    };
}

export default function Index({ batches }: Props) {
    return (
        <AppLayout>
            <Head title="Importação em Lote" />

            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Importação em Lote</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Histórico de planilhas processadas e emissão assíncrona de lotes fiscais
                        </p>
                    </div>

                    <Link
                        href="/batches/create"
                        className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Novo Lote de Planilha</span>
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-3.5">Lote / Arquivo</th>
                                    <th className="px-6 py-3.5">Total Linhas</th>
                                    <th className="px-6 py-3.5">Sucessos</th>
                                    <th className="px-6 py-3.5">Falhas</th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5">Data de Envio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {batches?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                            <p className="font-medium text-slate-600">Nenhum lote importado ainda</p>
                                            <p className="text-xs text-slate-400 mt-1">Envie uma planilha Excel ou CSV para iniciar o faturamento em lote</p>
                                        </td>
                                    </tr>
                                ) : (
                                    batches.data.map((b) => (
                                        <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-slate-800 flex items-center space-x-2">
                                                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span>{b.file_name}</span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-700">{b.total_rows}</td>
                                            <td className="px-6 py-4 text-emerald-600 font-semibold">{b.success_count}</td>
                                            <td className="px-6 py-4 text-red-600 font-semibold">{b.error_count}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                                    {b.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{b.created_at}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
