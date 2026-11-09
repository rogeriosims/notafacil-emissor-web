import React, { useState, useEffect } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';
import axios from 'axios';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        borrower_document: '',
        borrower_name: '',
        service_item_id: '',
        description: '',
        amount: '',
    });

    const [simulation, setSimulation] = useState(null);

    useEffect(() => {
        if (data.amount && data.service_item_id) {
            const debounce = setTimeout(() => {
                axios.post('/api/invoices/simulate', {
                    amount: data.amount,
                    service_item_id: data.service_item_id,
                }).then(response => {
                    setSimulation(response.data);
                }).catch(error => {
                    console.error("Simulation error", error);
                });
            }, 500);

            return () => clearTimeout(debounce);
        }
    }, [data.amount, data.service_item_id]);

    const submit = (e) => {
        e.preventDefault();
        post('/invoices');
    };

    return (
        <AppLayout>
            <Head title="Nova Emissão" />
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-800 mb-6">Emissão de Nota Fiscal</h1>

                <form onSubmit={submit} className="bg-white rounded-lg shadow p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="borrower_document" className="block text-sm font-medium text-gray-700">CPF/CNPJ do Tomador</label>
                            <input
                                type="text"
                                id="borrower_document"
                                value={data.borrower_document}
                                onChange={e => setData('borrower_document', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            {errors.borrower_document && <div className="text-red-600 text-xs mt-1">{errors.borrower_document}</div>}
                        </div>
                        
                        <div>
                            <label htmlFor="borrower_name" className="block text-sm font-medium text-gray-700">Nome/Razão Social</label>
                            <input
                                type="text"
                                id="borrower_name"
                                value={data.borrower_name}
                                onChange={e => setData('borrower_name', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            {errors.borrower_name && <div className="text-red-600 text-xs mt-1">{errors.borrower_name}</div>}
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="service_item_id" className="block text-sm font-medium text-gray-700">Serviço Municipal (Item LC 116)</label>
                            <input
                                type="text"
                                id="service_item_id"
                                value={data.service_item_id}
                                onChange={e => setData('service_item_id', e.target.value)}
                                placeholder="Ex: 1.01"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            {errors.service_item_id && <div className="text-red-600 text-xs mt-1">{errors.service_item_id}</div>}
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Discriminação dos Serviços</label>
                            <textarea
                                id="description"
                                rows={4}
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                            ></textarea>
                            {errors.description && <div className="text-red-600 text-xs mt-1">{errors.description}</div>}
                        </div>

                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Valor do Serviço (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                id="amount"
                                value={data.amount}
                                onChange={e => setData('amount', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            {errors.amount && <div className="text-red-600 text-xs mt-1">{errors.amount}</div>}
                        </div>
                    </div>

                    {simulation && (
                        <div className="mt-6 bg-slate-50 border border-slate-200 rounded p-4">
                            <h3 className="text-sm font-semibold text-slate-700 mb-2">Simulação Fiscal</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="block text-slate-500">Valor Base</span>
                                    <span className="font-medium text-slate-900">R$ {simulation.base_amount}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-500">Alíquota ISS</span>
                                    <span className="font-medium text-slate-900">{simulation.iss_rate}%</span>
                                </div>
                                <div>
                                    <span className="block text-slate-500">Valor ISS</span>
                                    <span className="font-medium text-slate-900">R$ {simulation.iss_amount}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-500">Líquido</span>
                                    <span className="font-medium text-slate-900">R$ {simulation.net_amount}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t">
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-50"
                        >
                            Emitir Nota Fiscal
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}