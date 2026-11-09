import React from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { CalendarClock, Plus, CheckCircle2, PauseCircle, Clock } from 'lucide-react';

interface ScheduleItem {
    id: number;
    type: string;
    day_of_month: number;
    amount: string;
    status: string;
    description: string;
    next_execution_at: string;
}

interface Props {
    schedules: {
        data: ScheduleItem[];
        total: number;
    };
}

export default function Index({ schedules }: Props) {
    return (
        <AppLayout>
            <Head title="Agendamentos Recorrentes" />

            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Agendamentos de NFS-e</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Automatize a emissão mensal de contratos e serviços recorrentes
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-3.5">Identificador</th>
                                    <th className="px-6 py-3.5">Dia de Cobrança</th>
                                    <th className="px-6 py-3.5">Valor Estimado</th>
                                    <th className="px-6 py-3.5">Próxima Emissão</th>
                                    <th className="px-6 py-3.5">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {schedules?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            <CalendarClock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                            <p className="font-medium text-slate-600">Nenhum agendamento cadastrado</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Crie um agendamento para faturamento recorrente automático
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    schedules.data.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-slate-800">
                                                Agendamento #{s.id}
                                                <span className="block text-[11px] text-slate-400 font-normal truncate max-w-xs">{s.description}</span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-700">Dia {s.day_of_month}</td>
                                            <td className="px-6 py-4 font-bold text-emerald-700">R$ {s.amount}</td>
                                            <td className="px-6 py-4 text-slate-500">{s.next_execution_at}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                                                    {s.status}
                                                </span>
                                            </td>
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
