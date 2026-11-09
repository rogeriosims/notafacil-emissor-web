import React from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Download, Copy, Ban, Eye } from 'lucide-react';

export default function Index({ invoices }) {
    return (
        <AppLayout>
            <Head title="Notas Fiscais" />
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Notas Fiscais</h1>
                    <p className="text-slate-500 text-sm mt-1">Gerencie as notas fiscais emitidas pela empresa.</p>
                </div>
                <Link
                    href="/invoices/create"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
                >
                    Nova Emissão
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tomador</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {invoices?.data?.map((invoice) => (
                            <tr key={invoice.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.number || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.borrower_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {invoice.amount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        {invoice.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                        <button className="text-blue-600 hover:text-blue-900" title="Ver Detalhes">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button className="text-gray-600 hover:text-gray-900" title="Download XML">
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button className="text-gray-600 hover:text-gray-900" title="Duplicar">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button className="text-red-600 hover:text-red-900" title="Cancelar">
                                            <Ban className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}