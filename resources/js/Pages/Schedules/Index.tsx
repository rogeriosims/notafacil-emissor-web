import React from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Head } from '@inertiajs/react';

export default function Index({ schedules }) {
    return (
        <AppLayout>
            <Head title="Agendamentos Recorrentes" />
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Agendamentos Recorrentes</h1>
                    <p className="text-slate-500 text-sm mt-1">Gerencie a emissão automática e recorrente de notas fiscais.</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tomador</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequência</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Próxima Execução</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {schedules?.data?.map((schedule) => (
                            <tr key={schedule.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{schedule.borrower_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{schedule.frequency}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{schedule.next_execution_at}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${schedule.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {schedule.is_active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}