import React from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { Head, usePage } from '@inertiajs/react';

export default function Index() {
    const { props } = usePage();

    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
                <div className="bg-white p-6 rounded-lg shadow">
                    <p>Bem-vindo ao dashboard, {props.auth?.user?.name}.</p>
                    {props.active_company_id && (
                        <p className="mt-2 text-sm text-gray-500">
                            Empresa ativa ID: {props.active_company_id}
                        </p>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}