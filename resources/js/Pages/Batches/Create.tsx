import React, { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { UploadCloud, FileSpreadsheet, ArrowLeft, Download, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function Create() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setMessage(null);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const resp = await axios.post('/api/batches', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setMessage({ text: 'Planilha enviada com sucesso! O processamento em lote foi iniciado.', type: 'success' });
            setTimeout(() => {
                router.visit('/batches');
            }, 1200);
        } catch (err: any) {
            setMessage({
                text: err.response?.data?.error || err.response?.data?.message || 'Falha ao enviar arquivo.',
                type: 'error',
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <AppLayout>
            <Head title="Importar Planilha de Notas" />

            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href="/batches"
                            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Voltar aos Lotes</span>
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                            Importar Planilha de NFS-e
                        </h1>
                        <p className="text-sm text-slate-500">
                            Faça o upload de arquivo Excel (.xlsx) ou CSV para emitir notas fiscais em massa
                        </p>
                    </div>

                    <a
                        href="/templates/modelo_importacao_nfse.xlsx"
                        download
                        className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Baixar Planilha Modelo</span>
                    </a>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl text-xs font-medium flex items-center space-x-2 ${
                        message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                        {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                        <span>{message.text}</span>
                    </div>
                )}

                <form onSubmit={handleUpload} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
                    <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-8 text-center transition-colors">
                        <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <label className="cursor-pointer">
                            <span className="text-sm font-bold text-emerald-600 hover:text-emerald-700">
                                Clique para selecionar o arquivo
                            </span>
                            <span className="text-xs text-slate-400 block mt-1">
                                Formatos suportados: .xlsx, .csv (tamanho máximo: 10MB)
                            </span>
                            <input
                                type="file"
                                accept=".xlsx,.csv"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>

                        {file && (
                            <div className="mt-4 p-3 bg-emerald-50 rounded-lg inline-flex items-center space-x-2 text-xs font-semibold text-emerald-800 border border-emerald-200">
                                <FileSpreadsheet className="w-4 h-4" />
                                <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={!file || isUploading}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center space-x-2"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Processando Lote...</span>
                                </>
                            ) : (
                                <span>Iniciar Processamento</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
