import React from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Briefcase, ArrowLeft, Save } from 'lucide-react';

interface ServiceCode {
    code: string;
    description: string;
    min_rate: number;
    max_rate: number;
}

interface Props {
    service_codes: ServiceCode[];
}

export default function Create({ service_codes }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        service_code: service_codes[0]?.code || '1.01',
        description: service_codes[0]?.description || '',
        cnae_code: '',
        default_rate: 2.0,
        allow_retention: true,
    });

    const handleCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = service_codes.find(c => c.code === e.target.value);
        setData({
            ...data,
            service_code: e.target.value,
            description: selected ? selected.description : data.description,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/services');
    };

    return (
        <AppLayout>
            <Head title="Cadastrar Serviço da Empresa" />

            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <Link
                        href="/services"
                        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Voltar aos Serviços</span>
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Novo Serviço Prestado</h1>
                    <p className="text-sm text-slate-500">Vincule um código de serviço da LC 116 com a alíquota municipal</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Código da Lista de Serviços (LC 116/2003) *
                        </label>
                        <select
                            value={data.service_code}
                            onChange={handleCodeChange}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            {service_codes.map(c => (
                                <option key={c.code} value={c.code}>
                                    {c.code} - {c.description.substring(0, 80)}...
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Descrição / Nome do Serviço na Empresa *
                        </label>
                        <input
                            type="text"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                        />
                        {errors.description && <p className="text-[11px] text-red-600 mt-1">{errors.description}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Alíquota Padrão ISS (%) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="2"
                                max="5"
                                value={data.default_rate}
                                onChange={(e) => setData('default_rate', parseFloat(e.target.value) || 2.0)}
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                required
                            />
                            {errors.default_rate && <p className="text-[11px] text-red-600 mt-1">{errors.default_rate}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                CNAE Correspondente
                            </label>
                            <input
                                type="text"
                                placeholder="Ex: 6201-5/01"
                                value={data.cnae_code}
                                onChange={(e) => setData('cnae_code', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            type="checkbox"
                            id="allow_retention"
                            checked={data.allow_retention}
                            onChange={(e) => setData('allow_retention', e.target.checked)}
                            className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                        />
                        <label htmlFor="allow_retention" className="text-xs font-medium text-slate-700">
                            Permite retenção de ISS pelo tomador
                        </label>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all shadow-sm"
                        >
                            <Save className="w-3.5 h-3.5" />
                            <span>Salvar Serviço</span>
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
