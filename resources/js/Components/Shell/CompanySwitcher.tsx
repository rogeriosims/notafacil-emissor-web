import React, { useEffect } from 'react';
import { router } from '@inertiajs/react';

export default function CompanySwitcher({ companies, activeCompanyId }) {

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                console.log('Atalho de teclado acionado para alternar empresa');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleChange = (e) => {
        const newCompanyId = e.target.value;
        router.post('/api/set-impersonation', { company_id: newCompanyId });
    };

    return (
        <div className="company-switcher p-2">
            <select
                id="company-select"
                value={activeCompanyId || ''}
                onChange={handleChange}
                className="border p-1 rounded"
            >
                <option value="">Selecione...</option>
                {companies?.map(company => (
                    <option key={company.id} value={company.id}>
                        {company.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
