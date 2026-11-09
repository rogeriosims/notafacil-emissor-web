import React, { useState } from 'react';
import CompanySwitcher from '../Components/Shell/CompanySwitcher';
import { usePage, router } from '@inertiajs/react';
import { LogOut, User as UserIcon, Shield } from 'lucide-react';

export default function Header() {
    const { props } = usePage<any>();
    const user = props.auth?.user;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 shadow-sm sticky top-0 z-30">
            <div className="flex items-center space-x-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Ambiente Fiscal
                </span>
            </div>

            <div className="flex items-center space-x-4">
                <CompanySwitcher />

                <div className="h-6 w-px bg-slate-200" />

                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="text-left hidden md:block">
                            <span className="block text-xs font-semibold text-slate-800 leading-tight">
                                {user?.name || 'Usuário'}
                            </span>
                            <span className="block text-[11px] text-slate-400 font-medium leading-tight">
                                {user?.email}
                            </span>
                        </div>
                    </button>

                    {isMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                <div className="px-4 py-2 border-b border-slate-100">
                                    <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2.5 text-left text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors font-medium"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Encerrar Sessão</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
