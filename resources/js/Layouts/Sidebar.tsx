import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    FileText,
    FilePlus,
    Layers,
    CalendarClock,
    Settings,
    ShieldCheck,
    ReceiptText
} from 'lucide-react';

export default function Sidebar() {
    const { url } = usePage();

    const sections = [
        {
            group: 'Operação Fiscal',
            items: [
                { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
                { name: 'Notas Fiscais', href: '/invoices', icon: FileText },
                { name: 'Nova Emissão', href: '/invoices/create', icon: FilePlus },
            ]
        },
        {
            group: 'Processamento',
            items: [
                { name: 'Importação em Lote', href: '/batches', icon: Layers },
                { name: 'Agendamentos', href: '/schedules', icon: CalendarClock },
            ]
        },
        {
            group: 'Configurações',
            items: [
                { name: 'Certificado e Dados', href: '/companies/settings', icon: Settings },
            ]
        }
    ];

    const isItemActive = (href: string) => {
        if (href === '/dashboard') return url === '/dashboard' || url === '/';
        if (href === '/invoices') return url === '/invoices' || url.startsWith('/invoices/') && !url.includes('/create');
        return url.startsWith(href);
    };

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 h-screen flex flex-col border-r border-slate-800 shrink-0 select-none">
            {/* Logo Header */}
            <div className="h-16 flex items-center px-6 border-b border-slate-800/80 bg-slate-950/40">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black mr-3 shadow-md shadow-emerald-500/20">
                    <ReceiptText className="w-5 h-5" />
                </div>
                <div>
                    <span className="font-bold text-base tracking-tight text-white block leading-tight">Nota Fácil</span>
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block leading-tight">Emissor Web</span>
                </div>
            </div>

            {/* Navigation Menus */}
            <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
                {sections.map((section, idx) => (
                    <div key={idx} className="space-y-1">
                        <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            {section.group}
                        </div>
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            const active = isItemActive(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                                        active
                                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 mr-3 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Footer Status */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-950/20 text-xs flex items-center justify-between text-slate-400">
                <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-medium text-slate-300">Motor Fiscal Ativo</span>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
        </aside>
    );
}
