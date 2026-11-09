import React, { useState } from 'react';
import { X, Search, Loader2, Save, Building2, MapPin } from 'lucide-react';
import { lookupService } from '../../services/lookupService';
import { formatCpfCnpj, formatCep } from '../../lib/utils';
import axios from 'axios';

export interface BorrowerData {
    id?: number;
    taxId: string;
    name: string;
    tradeName?: string;
    email?: string;
    phone?: string;
    municipalRegistration?: string;
    address: {
        cep: string;
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
        ibgeCode: string;
    };
    issWithheld?: boolean;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onBorrowerCreated: (borrower: BorrowerData) => void;
}

export default function BorrowerQuickCreateModal({ isOpen, onClose, onBorrowerCreated }: Props) {
    if (!isOpen) return null;

    const [taxId, setTaxId] = useState('');
    const [name, setName] = useState('');
    const [tradeName, setTradeName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [municipalRegistration, setMunicipalRegistration] = useState('');
    const [cep, setCep] = useState('');
    const [street, setStreet] = useState('');
    const [number, setNumber] = useState('');
    const [complement, setComplement] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [ibgeCode, setIbgeCode] = useState('');
    const [issWithheld, setIssWithheld] = useState(false);

    const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
    const [isSearchingCep, setIsSearchingCep] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Consulta CNPJ Automática
    const handleSearchCnpj = async () => {
        const clean = taxId.replace(/\D/g, '');
        if (clean.length !== 14) {
            setFeedbackMessage({ text: 'Informe um CNPJ válido com 14 dígitos.', type: 'error' });
            return;
        }

        setIsSearchingCnpj(true);
        setFeedbackMessage(null);
        try {
            const data = await lookupService.fetchCnpj(clean);
            setName(data.companyName || data.name);
            setTradeName(data.tradeName || '');
            if (data.address) {
                setStreet(data.address.street || '');
                setNumber(data.address.number || '');
                setComplement(data.address.complement || '');
                setNeighborhood(data.address.neighborhood || '');
                setCity(data.address.city || '');
                setState(data.address.state || '');
                setCep(data.address.zipCode || '');
                setIbgeCode(data.address.ibgeCode || '');
            }
            setFeedbackMessage({ text: `Dados consultados com sucesso via ${data.source}!`, type: 'success' });
        } catch (err: any) {
            setFeedbackMessage({ text: err.message || 'Erro ao consultar CNPJ.', type: 'error' });
        } finally {
            setIsSearchingCnpj(false);
        }
    };

    // Consulta CEP Automática
    const handleSearchCep = async () => {
        const clean = cep.replace(/\D/g, '');
        if (clean.length !== 8) {
            setFeedbackMessage({ text: 'Informe um CEP com 8 dígitos.', type: 'error' });
            return;
        }

        setIsSearchingCep(true);
        setFeedbackMessage(null);
        try {
            const data = await lookupService.fetchCep(clean);
            setStreet(data.street || '');
            setNeighborhood(data.neighborhood || '');
            setCity(data.city || '');
            setState(data.state || '');
            setIbgeCode(data.ibgeCode || data.ibge || '');
            setFeedbackMessage({ text: `Endereço preenchido via ${data.source}!`, type: 'success' });
        } catch (err: any) {
            setFeedbackMessage({ text: err.message || 'Erro ao consultar CEP.', type: 'error' });
        } finally {
            setIsSearchingCep(false);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!taxId || !name) {
            setFeedbackMessage({ text: 'Preencha ao menos CPF/CNPJ e Nome do Tomador.', type: 'error' });
            return;
        }

        const borrower: BorrowerData = {
            taxId,
            name,
            tradeName,
            email,
            phone,
            municipalRegistration,
            address: {
                cep,
                street,
                number,
                complement,
                neighborhood,
                city,
                state,
                ibgeCode,
            },
            issWithheld,
        };

        onBorrowerCreated(borrower);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-800">Novo Tomador de Serviço</h2>
                            <p className="text-xs text-slate-500">Cadastre o cliente com preenchimento automático por CNPJ e CEP</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1">
                    {feedbackMessage && (
                        <div className={`p-3 rounded-lg text-xs font-medium ${
                            feedbackMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                            {feedbackMessage.text}
                        </div>
                    )}

                    {/* Dados Básicos */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Identificação</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">CPF ou CNPJ *</label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        placeholder="00.000.000/0000-00"
                                        value={taxId}
                                        onChange={(e) => setTaxId(e.target.value)}
                                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSearchCnpj}
                                        disabled={isSearchingCnpj || taxId.replace(/\D/g, '').length !== 14}
                                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shrink-0"
                                        title="Consultar CNPJ no ACBr / Receita"
                                    >
                                        {isSearchingCnpj ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                                        <span>Consultar</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Inscrição Municipal</label>
                                <input
                                    type="text"
                                    placeholder="Opcional"
                                    value={municipalRegistration}
                                    onChange={(e) => setMunicipalRegistration(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Razão Social / Nome Completo *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Fantasia</label>
                                <input
                                    type="text"
                                    value={tradeName}
                                    onChange={(e) => setTradeName(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail para envio da NFS-e</label>
                                <input
                                    type="email"
                                    placeholder="cliente@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Endereço */}
                    <div className="pt-2 border-t border-slate-100">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Endereço do Tomador</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">CEP</label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        placeholder="00000-000"
                                        value={cep}
                                        onChange={(e) => setCep(e.target.value)}
                                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSearchCep}
                                        disabled={isSearchingCep || cep.replace(/\D/g, '').length !== 8}
                                        className="px-2.5 py-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shrink-0"
                                    >
                                        {isSearchingCep ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Logradouro / Rua</label>
                                <input
                                    type="text"
                                    value={street}
                                    onChange={(e) => setStreet(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Número</label>
                                <input
                                    type="text"
                                    value={number}
                                    onChange={(e) => setNumber(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Bairro</label>
                                <input
                                    type="text"
                                    value={neighborhood}
                                    onChange={(e) => setNeighborhood(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Complemento</label>
                                <input
                                    type="text"
                                    placeholder="Sala, Andar..."
                                    value={complement}
                                    onChange={(e) => setComplement(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Município</label>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">UF</label>
                                <input
                                    type="text"
                                    maxLength={2}
                                    value={state}
                                    onChange={(e) => setState(e.target.value.toUpperCase())}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Código IBGE Município</label>
                                <input
                                    type="text"
                                    value={ibgeCode}
                                    onChange={(e) => setIbgeCode(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
                        >
                            <Save className="w-3.5 h-3.5" />
                            <span>Utilizar este Tomador</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
