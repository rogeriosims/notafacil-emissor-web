import React, { useState, useRef } from 'react';
import AppLayout from '../../../Layouts/AppLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import {
    Database,
    UploadCloud,
    RefreshCw,
    FolderTree,
    FileText,
    Loader2,
    CheckCircle2,
    Wand2,
    ArrowLeft,
    Sparkles,
    AlertCircle
} from 'lucide-react';

interface ServiceCode {
    id: string;
    code: string;
    description: string;
    min_rate: number;
    max_rate: number;
}

interface Props {
    stats: {
        total_codes: number;
        total_items: number;
    };
    recent_codes: ServiceCode[];
}

export default function Index({ stats, recent_codes }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setFeedback(null);

        const formData = new FormData();
        formData.append('file', file);

        router.post(route('management.tax-settings.import'), formData, {
            onSuccess: () => {
                setFeedback({
                    text: 'Tabela de códigos fiscais importada e atualizada com sucesso!',
                    type: 'success',
                });
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
            onError: (errs) => {
                setFeedback({
                    text: errs.file || 'Erro ao importar arquivo CSV. Verifique a estrutura e tente novamente.',
                    type: 'error',
                });
                setIsUploading(false);
            }
        });
    };

    const handleSeedDefaults = () => {
        if (!confirm('Deseja povoar os códigos oficiais padrão da Lei Complementar 116/2003 no banco de dados?')) {
            return;
        }

        setIsSeeding(true);
        setFeedback(null);

        router.post(route('management.tax-settings.seed'), {}, {
            onSuccess: () => {
                setFeedback({
                    text: 'Catálogo oficial da LC 116/2003 povoado com sucesso!',
                    type: 'success',
                });
                setIsSeeding(false);
            },
            onError: () => {
                setFeedback({
                    text: 'Falha ao povoar catálogo da LC 116/2003.',
                    type: 'error',
                });
                setIsSeeding(false);
            }
        });
    };

    return (
        <AppLayout>
            <Head title="Configurações Fiscais e Tabelas (Backoffice)" />

            <div className="max-w-6xl mx-auto space-y-6 pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Link
                            href={route('management.service-codes.index')}
                            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Ver Todos os Códigos da LC 116</span>
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                            Configuração Fiscal & Tabelas Oficiais
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Gestão das tabelas tributárias nacionais (LC 116/2003, NBS) e importação em lote para o sistema
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleSeedDefaults}
                        disabled={isSeeding}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
                    >
                        {isSeeding ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-yellow-400" />}
                        <span>Povoar Itens Padrão da LC 116</span>
                    </button>
                </div>

                {feedback && (
                    <div className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
                        feedback.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                        <div className="flex items-center gap-2">
                            {feedback.type === 'success' ? <CheckCircle2 size={18} className="text-green-600" /> : <AlertCircle size={18} className="text-red-600" />}
                            <span>{feedback.text}</span>
                        </div>
                        <button type="button" onClick={() => setFeedback(null)} className="font-bold text-xs opacity-60 hover:opacity-100">×</button>
                    </div>
                )}

                {/* Estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Database size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Códigos LC 116 Cadastrados</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.total_codes}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <FileText size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Serviços Vinculados a Empresas</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.total_items}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <RefreshCw size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Status do Catálogo</p>
                            <p className="text-sm font-bold text-slate-900">
                                {stats.total_codes > 0 ? 'Catálogo Ativo & Operacional' : 'Necessita Povoamento'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Importação de Arquivos e Ações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Card 1: Importação de CSV */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <UploadCloud size={20} className="text-blue-600" />
                                1. Importação de Tabelas Fiscais (CSV / TXT)
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                Importe ou atualize a tabela completa de códigos da LC 116 ou NBS 2.0.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs text-slate-600">
                                Formato aceito: Arquivo CSV separado por ponto-e-vírgula (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">;</code>) ou vírgula.
                                <br />
                                Colunas: <span className="font-semibold">CODIGO; DESCRICAO; ALIQUOTA_MIN; ALIQUOTA_MAX</span>
                                <br />
                                <span className="text-[11px] text-slate-400">Suporta arquivos gerados pelo Excel em ISO-8859-1 (Latin1) ou UTF-8.</span>
                            </p>

                            <div
                                onClick={() => !isUploading && fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-300 rounded-xl p-8 hover:bg-slate-50/70 hover:border-blue-400 flex flex-col items-center justify-center cursor-pointer transition-all"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 size={32} className="text-blue-600 animate-spin mb-2" />
                                        <span className="text-sm font-semibold text-slate-700">Processando e importando linhas...</span>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud size={32} className="text-slate-400 mb-2" />
                                        <span className="text-sm font-semibold text-slate-700">Clique para selecionar arquivo CSV</span>
                                        <span className="text-xs text-slate-400 mt-1">Máximo 10MB</span>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.txt"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Ações Automatizadas */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Wand2 size={20} className="text-purple-600" />
                                2. Ferramentas de Manutenção & Povoamento
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                Utilitários para inicialização rápida e reconciliação dos serviços
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">Povoamento Rápido da LC 116/2003</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Insere ou atualiza os 24 subitens mais utilizados no mercado brasileiro com alíquotas constitucionais (2% a 5%).
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSeedDefaults}
                                    disabled={isSeeding}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 shrink-0 ml-3"
                                >
                                    Executar
                                </button>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">Ver Catálogo Completo</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Visualize todos os códigos fiscais cadastrados, filtre por descrição e verifique alíquotas mínimas e máximas.
                                    </p>
                                </div>
                                <Link
                                    href={route('management.service-codes.index')}
                                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 shrink-0 ml-3"
                                >
                                    Acessar
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabela de Amostra dos Códigos Recentes */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                            Códigos da LC 116 no Banco de Dados ({recent_codes.length} exibidos)
                        </h3>
                        <Link
                            href={route('management.service-codes.index')}
                            className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                        >
                            Ver Todos →
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-3.5">Código</th>
                                    <th className="px-6 py-3.5">Descrição do Serviço (LC 116/2003)</th>
                                    <th className="px-6 py-3.5">Alíquota Mín.</th>
                                    <th className="px-6 py-3.5">Alíquota Máx.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recent_codes.map(c => (
                                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-6 py-3 font-mono font-bold text-blue-600">{c.code}</td>
                                        <td className="px-6 py-3 font-medium text-slate-800">{c.description}</td>
                                        <td className="px-6 py-3 font-mono text-slate-600">{c.min_rate}%</td>
                                        <td className="px-6 py-3 font-mono text-slate-600">{c.max_rate}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
