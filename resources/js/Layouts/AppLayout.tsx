import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ImpersonationBanner from '../Components/Shell/ImpersonationBanner';

export default function AppLayout({ children }) {
    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <ImpersonationBanner />
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}