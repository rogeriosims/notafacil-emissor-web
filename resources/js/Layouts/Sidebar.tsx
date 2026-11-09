import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Home, FileText, FilePlus, Layers, Calendar, Settings } from 'lucide-react';

export default function Sidebar() {
    const { url } = usePage();

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Notas Fiscais', href: '/invoices', icon: FileText },
        { name: 'Nova Emissão', href: '/invoices/create', icon: FilePlus },
        { name: 'Importação em Lote', href: '/batches', icon: Layers },
        { name: 'Agendamentos', href: '/schedules', icon: Calendar },
        { name: 'Configurações e Certificado', href: '/companies/settings', icon: Settings },
    ];

    return (
        <aside className="w-64 bg-white border-r h-full flex flex-col shadow-sm">
            <div className="h-16 flex items-center px-6 border-b font-bold text-xl text-slate-800">
                Nota Fácil
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = url.startsWith(item.href) && item.href !== '/invoices' || (item.href === '/invoices' && url === '/invoices');
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                >
                                    <Icon className="w-5 h-5 mr-3" />
                                    {item.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
}
