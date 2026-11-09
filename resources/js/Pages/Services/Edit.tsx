import React from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Briefcase, ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react';

interface ServiceCode {
    code: string;
    description: string;
    min_rate: number;
    max_rate: number;
}

interface ServiceItem {
    id: string;
    service_code: string;
    description: string;
    default_rate: number;
    cnae_code: string | null;
    allow_retention: boolean;
}

interface Props {
    service: ServiceItem;
    service_codes: ServiceCode[];
}

export default function Edit({ service, service_codes }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        service_code: service.service_code || service_codes[0]?.code || '1.01',
        description: service.description || '',
        cnae_code: service.cnae_code || '',
        default_rate: service.default_rate || 2.0,
        allow_retention: Boolean(service.allow_retention),
    });

    const handleCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = service_codes.find(c => c.code === e.target.value);
        setData(prev => ({
            ...prev,
            service_code: e.target.value,
            description: selected ? selected.description : prev.description,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('services.update', service.id));
    };

    const handleDelete = () => {
        if (confirm(`Tem certeza que deseja excluir o serviço "${service.description}"?`)) {
            router.delete(route('services.destroy', service.id));
        }
    };

    return (
        <AppLayout>
            <Head title={`Editar Serviço: ${service.service_code}`} />

            <div className="max-w-2xl mx-auto space-y-6 pb-12">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href={route('services.index')}
                            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Voltar aos Serviços</span>
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Editar Serviço Prestado</h1>
                        <p className="text-sm text-slate-500">Configuração de tributação municipal e enquadramento na LC 116/2003</p>
                    </div>

                    <button
                        type="button"
                        onClick={handleDelete}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Excluir Serviço</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Código da Lista de Serviços (LC 116/2003) *
                        </label>
                        <select
                            value={data.service_code}
                            onChange={handleCodeChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 font-mono"
                        >
                            {service_codes.map(c => (
                                <option key={c.code} value={c.code}>
                                    {c.code} - {c.description.substring(0, 70)}...
                                </option>
                            ))}
                        </select>
                        {errors.service_code && <p className="text-xs text-red-500 mt-1">{errors.service_code}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Descrição Detalhada do Serviço *
                        </label>
                        <textarea
                            rows={3}
                            required
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Código CNAE (Opcional)
                            </label>
                            <input
                                type="text"
                                placeholder="6201-5/01"
                                value={data.cnae_code}
                                onChange={(e) => setData('cnae_code', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Alíquota Padrão de ISS (%) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="2"
                                max="5"
                                required
                                value={data.default_rate}
                                onChange={(e) => setData('default_rate', parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">Conforme LC 116, alíquota entre 2.0% e 5.0%</p>
                            {errors.default_rate && <p className="text-xs text-red-500 mt-1">{errors.default_rate}</p>}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.allow_retention}
                                onChange={(e) => setData('allow_retention', e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                            />
                            <div>
                                <span className="text-sm font-medium text-slate-800">
                                    Permite Retenção de ISS na Fonte
                                </span>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Marque se o tomador do serviço pode reter o ISS devido em seu município.
                                </p>
                            </div>
                        </label>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                        <Link
                            href={route('services.index')}
                            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Salvando...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Salvar Alterações</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
