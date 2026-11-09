<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Models\Certificate;
use App\Models\Company;
use App\Models\Office;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class CompanyWebController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Company::with('office')->withCount('certificates');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('cnpj', 'like', "%{$search}%")
                  ->orWhere('trade_name', 'like', "%{$search}%");
            });
        }

        $companies = $query->latest('id')->paginate(15)->withQueryString();

        return Inertia::render('Management/Companies/Index', [
            'companies' => $companies,
            'filters' => $request->only('search'),
        ]);
    }

    public function create(): Response
    {
        $offices = Office::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Management/Companies/Create', [
            'offices' => $offices,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'office_id' => ['required', 'exists:offices,id'],
            'name' => ['required', 'string', 'max:255'],
            'cnpj' => ['required', 'string'],
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

        $validated['cnpj'] = preg_replace('/\D/', '', $validated['cnpj']);
        if (!empty($validated['zip_code'])) {
            $validated['zip_code'] = preg_replace('/\D/', '', $validated['zip_code']);
        }

        $company = Company::create($validated);

        return redirect()->route('management.companies.index')->with('success', 'Empresa cadastrada com sucesso.');
    }

    public function edit(string $id): Response
    {
        $company = Company::with(['office', 'certificates', 'users'])->findOrFail($id);
        $offices = Office::orderBy('name')->get(['id', 'name']);
        $latestCert = $company->certificates->sortByDesc('created_at')->first();

        return Inertia::render('Management/Companies/Edit', [
            'company' => array_merge($company->toArray(), [
                'certificate' => $latestCert ? [
                    'id' => $latestCert->id,
                    'expires_at' => $latestCert->expires_at?->format('d/m/Y H:i'),
                    'is_valid' => $latestCert->expires_at ? $latestCert->expires_at->isFuture() : false,
                    'issuer_info' => $latestCert->issuer_info,
                    'created_at' => $latestCert->created_at?->format('d/m/Y H:i'),
                ] : null,
            ]),
            'offices' => $offices,
        ]);
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $company = Company::findOrFail($id);

        $validated = $request->validate([
            'office_id' => ['required', 'exists:offices,id'],
            'name' => ['required', 'string', 'max:255'],
            'cnpj' => ['required', 'string'],
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

        $validated['cnpj'] = preg_replace('/\D/', '', $validated['cnpj']);
        if (!empty($validated['zip_code'])) {
            $validated['zip_code'] = preg_replace('/\D/', '', $validated['zip_code']);
        }

        $company->update($validated);

        return back()->with('success', 'Dados da empresa atualizados com sucesso.');
    }

    public function uploadCertificate(Request $request, string $id): RedirectResponse
    {
        $company = Company::findOrFail($id);

        $request->validate([
            'certificate' => ['required', 'file', 'max:5120'],
            'password' => ['required', 'string'],
        ]);

        $file = $request->file('certificate');
        $password = $request->input('password');
        $content = file_get_contents($file->getRealPath());

        $certs = [];
        if (!openssl_pkcs12_read($content, $certs, $password)) {
            return back()->withErrors(['certificate' => 'Senha incorreta ou arquivo PFX/P12 inválido/corrompido.']);
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

        return back()->with('success', 'Certificado Digital A1 instalado com sucesso!');
    }

    public function destroy(string $id): RedirectResponse
    {
        $company = Company::findOrFail($id);
        $company->delete();

        return redirect()->route('management.companies.index')->with('success', 'Empresa excluída com sucesso.');
    }
}
