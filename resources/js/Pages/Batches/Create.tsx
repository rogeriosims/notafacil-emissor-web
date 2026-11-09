import React from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors, progress } = useForm({
        file: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/batches');
    };

    return (
        <AppLayout>
            <Head title="Importar Planilha" />
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-800 mb-6">Importar Planilha em Lote</h1>
                
                <form onSubmit={submit} className="bg-white rounded-lg shadow p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Arquivo (XLSX ou CSV - máximo 300 linhas)
                        </label>
                        <input 
                            type="file" 
                            accept=".xlsx,.csv"
                            onChange={e => setData('file', e.target.files[0])}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-emerald-50 file:text-emerald-700
                                hover:file:bg-emerald-100"
                        />
                        {errors.file && <div className="text-red-600 text-xs mt-1">{errors.file}</div>}
                    </div>

                    {progress && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                            <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${progress.percentage}%` }}></div>
                        </div>
                    )}

                    <div className="flex justify-end mt-6">
                        <button
                            type="submit"
                            disabled={processing || !data.file}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-50"
                        >
                            Enviar Lote
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}