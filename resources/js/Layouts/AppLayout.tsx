import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ImpersonationBanner from '../Components/Shell/ImpersonationBanner';

interface AppLayoutProps {
    children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden antialiased">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
                <ImpersonationBanner />
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
