<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Models\Certificate;
use App\Models\Company;
use App\Models\Office;
use App\Services\ImpersonationManager;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class CompanySettingsController extends Controller
{
    public function __construct(
        private readonly ImpersonationManager $impersonationManager
    ) {}

    public function index(Request $request): Response
    {
        $companyId = $this->impersonationManager->getActiveCompanyId()
            ?? $request->user()?->companies()->first()?->id
            ?? Company::first()?->id;

        $company = $companyId 
            ? Company::with(['office', 'certificates', 'users', 'serviceItems'])->find($companyId) 
            : null;

        $offices = Office::orderBy('name')->get(['id', 'name']);
        $latestCert = $company?->certificates->sortByDesc('created_at')->first();

        return Inertia::render('Companies/Settings', [
            'company' => $company ? array_merge($company->toArray(), [
                'certificate' => $latestCert ? [
                    'id' => $latestCert->id,
                    'expires_at' => $latestCert->expires_at?->format('d/m/Y H:i') ?? 'Indefinido',
                    'is_valid' => $latestCert->expires_at ? $latestCert->expires_at->isFuture() : false,
                    'created_at' => $latestCert->created_at?->format('d/m/Y H:i') ?? '-',
                    'issuer_info' => $latestCert->issuer_info,
                ] : null,
            ]) : null,
            'offices' => $offices,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $companyId = $this->impersonationManager->getActiveCompanyId()
            ?? $request->user()?->companies()->first()?->id
            ?? Company::first()?->id;

        if (!$companyId) {
            return back()->withErrors(['company' => 'Nenhuma empresa selecionada.']);
        }

        $company = Company::findOrFail($companyId);

        $validated = $request->validate([
            'office_id' => ['nullable', 'exists:offices,id'],
            'name' => ['required', 'string', 'max:255'],
            'trade_name' => ['nullable', 'string'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string'],
            // Endereço
            'zip_code' => ['nullable', 'string'],
            'street' => ['nullable', 'string'],
            'number' => ['nullable', 'string'],
            'complement' => ['nullable', 'string'],
            'neighborhood' => ['nullable', 'string'],
            'city' => ['nullable', 'string'],
            'state' => ['nullable', 'string', 'max:2'],
            'city_code' => ['nullable', 'string'],
            // Fiscal
            'municipal_registration' => ['nullable', 'string'],
            'op_simples_nacional' => ['nullable', 'integer', 'in:1,2,3'],
            'apuracao_sn' => ['nullable', 'integer'],
            'regime_especial_tributacao' => ['nullable', 'integer'],
            'incentivo_fiscal' => ['nullable', 'boolean'],
            'rps_last_lote' => ['nullable', 'integer'],
            'rps_series' => ['nullable', 'string', 'max:10'],
            'rps_last_number' => ['nullable', 'integer'],
            'city_hall_login' => ['nullable', 'string'],
            'city_hall_password' => ['nullable', 'string'],
            'fiscal_driver' => ['nullable', 'string', 'in:acbr,mock,crawler'],
        ]);

        if (!empty($validated['zip_code'])) {
            $validated['zip_code'] = preg_replace('/\D/', '', $validated['zip_code']);
        }

        $company->update($validated);

        return back()->with('success', 'Configurações da empresa atualizadas com sucesso.');
    }

    public function uploadCertificate(Request $request): RedirectResponse
    {
        $companyId = $this->impersonationManager->getActiveCompanyId()
            ?? $request->user()?->companies()->first()?->id
            ?? Company::first()?->id;

        if (!$companyId) {
            return back()->withErrors(['certificate' => 'Nenhuma empresa selecionada.']);
        }

        $company = Company::findOrFail($companyId);

        $request->validate([
            'certificate' => ['required', 'file', 'max:5120'],
            'password' => ['required', 'string'],
        ]);

        $file = $request->file('certificate');
        $password = $request->input('password');
        $content = file_get_contents($file->getRealPath());

        $certs = [];
        if (!openssl_pkcs12_read($content, $certs, $password)) {
            return back()->withErrors(['certificate' => 'Senha incorreta ou arquivo PFX/P12 corrompido/inválido.']);
        }

        $x509 = openssl_x509_parse($certs['cert']);
        $expiresAt = isset($x509['validTo_time_t']) ? Carbon::createFromTimestamp($x509['validTo_time_t']) : null;
        $issuerInfo = json_encode([
            'subject' => $x509['subject'] ?? [],
            'issuer' => $x509['issuer'] ?? [],
            'valid_from' => isset($x509['validFrom_time_t']) ? date('c', $x509['validFrom_time_t']) : null,
            'valid_to' => isset($x509['validTo_time_t']) ? date('c', $x509['validTo_time_t']) : null,
        ]);

        Certificate::updateOrCreate(
            ['company_id' => $company->id],
            [
                'pfx_encrypted' => base64_encode($content),
                'password_encrypted' => $password,
                'expires_at' => $expiresAt,
                'issuer_info' => $issuerInfo,
            ]
        );

        return back()->with('success', 'Certificado Digital A1 validado e instalado com sucesso!');
    }
}
