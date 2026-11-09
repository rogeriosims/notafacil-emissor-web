import React from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';

export default function Show({ invoice }) {
    return (
        <AppLayout>
            <Head title={`Nota Fiscal #${invoice?.number || 'Detalhes'}`} />
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-800">Detalhes da Nota Fiscal</h1>
                    <Link href="/invoices" className="text-emerald-600 hover:text-emerald-800 font-medium text-sm">
                        Voltar para listagem
                    </Link>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="block text-sm text-gray-500">Tomador</span>
                            <span className="font-medium">{invoice?.borrower_name}</span>
                        </div>
                        <div>
                            <span className="block text-sm text-gray-500">Valor</span>
                            <span className="font-medium">R$ {invoice?.amount}</span>
                        </div>
                        <div>
                            <span className="block text-sm text-gray-500">Status</span>
                            <span className="font-medium">{invoice?.status}</span>
                        </div>
                        <div className="col-span-2">
                            <span className="block text-sm text-gray-500">Discriminação</span>
                            <p className="font-medium whitespace-pre-wrap">{invoice?.description}</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}