import React from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ batches }) {
    return (
        <AppLayout>
            <Head title="Lotes de Importação" />
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Lotes de Importação</h1>
                    <p className="text-slate-500 text-sm mt-1">Gerencie os lotes de emissão em massa enviados via planilha.</p>
                </div>
                <Link
                    href="/batches/create"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
                >
                    Novo Lote
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total de Linhas</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {batches?.data?.map((batch) => (
                            <tr key={batch.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{batch.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                        {batch.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.total_rows}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}