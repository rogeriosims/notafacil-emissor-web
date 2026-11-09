import React, { useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Settings as SettingsIcon,
    ShieldCheck,
    UploadCloud,
    AlertCircle,
    CheckCircle2,
    Lock,
    Key,
    Building2,
    Save,
    Loader2
} from 'lucide-react';
import axios from 'axios';

interface Props {
    company: {
        id: number;
        name: string;
        fiscal_driver: string;
        certificate?: {
            id: number;
            expires_at: string;
            is_valid: boolean;
            created_at: string;
        } | null;
    } | null;
}

export default function Settings({ company }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: company?.name || '',
        fiscal_driver: company?.fiscal_driver || 'acbr',
    });

    const [certFile, setCertFile] = useState<File | null>(null);
    const [certPassword, setCertPassword] = useState('');
    const [isUploadingCert, setIsUploadingCert] = useState(false);
    const [certMessage, setCertMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        post('/companies/settings');
    };

    const handleUploadCertificate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!certFile || !certPassword || !company) return;

        setIsUploadingCert(true);
        setCertMessage(null);

        const formData = new FormData();
        formData.append('certificate', certFile);
        formData.append('password', certPassword);

        try {
            await axios.post(`/api/companies/${company.id}/certificate`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setCertMessage({ text: 'Certificado Digital A1 sincronizado com sucesso!', type: 'success' });
            setCertFile(null);
            setCertPassword('');
            router.reload();
        } catch (err: any) {
            setCertMessage({
                text: err.response?.data?.message || 'Falha ao sincronizar certificado.',
                type: 'error',
            });
        } finally {
            setIsUploadingCert(false);
        }
    };

    return (
        <AppLayout>
            <Head title="Configurações e Certificado Digital" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                        Configurações e Certificado Digital
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Gerencie as credenciais da empresa e o Certificado Digital A1 de emissão
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dados Gerais da Empresa */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                            <Building2 className="w-4 h-4 text-emerald-600" />
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                Dados da Empresa
                            </h2>
                        </div>

                        <form onSubmit={handleSaveSettings} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Nome / Razão Social
                                </label>
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
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Provedor do Motor Fiscal
                                </label>
                                <select
                                    value={data.fiscal_driver}
                                    onChange={(e) => setData('fiscal_driver', e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="acbr">ACBr API (Padrão Nacional)</option>
                                    <option value="mock">Ambiente Mock (Homologação Interna)</option>
                                    <option value="crawler">Crawler Municipal</option>
                                </select>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Salvar Configurações</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Módulo de Certificado Digital A1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                Certificado Digital A1
                            </h2>
                        </div>

                        {company?.certificate ? (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                                <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>Certificado Ativo no Servidor</span>
                                </div>
                                <div className="text-xs text-emerald-700 space-y-1">
                                    <p>Válido até: <strong>{company.certificate.expires_at}</strong></p>
                                    <p className="text-[11px] text-emerald-600">Sincronizado em: {company.certificate.created_at}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2 text-xs text-amber-800">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold block">Nenhum certificado ativo vinculado</span>
                                    <span className="text-[11px] block mt-0.5">Faça o upload do arquivo .pfx ou .p12 para autorizar as notas fiscais</span>
                                </div>
                            </div>
                        )}

                        {certMessage && (
                            <div className={`p-3 rounded-lg text-xs font-medium ${
                                certMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                            }`}>
                                {certMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleUploadCertificate} className="space-y-3 pt-2">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Arquivo do Certificado (.pfx / .p12)
                                </label>
                                <input
                                    type="file"
                                    accept=".pfx,.p12"
                                    onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Senha do Certificado
                                </label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={certPassword}
                                    onChange={(e) => setCertPassword(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isUploadingCert || !certFile || !certPassword}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2"
                            >
                                {isUploadingCert ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                                <span>Salvar e Validar Certificado</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
