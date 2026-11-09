import axios from 'axios';

export interface CnpjAddress {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    ibgeCode: string;
}

export interface CnpjLookupData {
    cnpj: string;
    name: string;
    companyName: string;
    tradeName?: string;
    status: string;
    address: CnpjAddress;
    taxStatus?: string;
    cnae?: string;
    source: string;
}

export interface CepLookupData {
    cep: string;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    ibge: string;
    ibgeCode: string;
    source: string;
}

export const lookupService = {
    async fetchCnpj(cnpj: string): Promise<CnpjLookupData> {
        const clean = cnpj.replace(/\D/g, '');
        if (clean.length !== 14) {
            throw new Error('CNPJ deve conter 14 dígitos numéricos.');
        }

        const response = await axios.get<{ success: boolean; data: CnpjLookupData }>(`/api/lookup/cnpj/${clean}`);
        if (!response.data.success) {
            throw new Error('Falha ao consultar CNPJ');
        }
        return response.data.data;
    },

    async fetchCep(cep: string): Promise<CepLookupData> {
        const clean = cep.replace(/\D/g, '');
        if (clean.length !== 8) {
            throw new Error('CEP deve conter 8 dígitos numéricos.');
        }

        const response = await axios.get<{ success: boolean; data: CepLookupData }>(`/api/lookup/cep/${clean}`);
        if (!response.data.success) {
            throw new Error('Falha ao consultar CEP');
        }
        return response.data.data;
    },

    async simulateInvoice(params: {
        amount: number;
        service_item_id?: string | number;
        iss_rate?: number;
        iss_withheld?: boolean;
    }) {
        const response = await axios.post('/api/invoices/simulate', params);
        return response.data;
    }
};
