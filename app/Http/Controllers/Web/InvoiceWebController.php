<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Domain\Fiscal\DTOs\CanonicalInvoiceDTO;
use App\Domain\Fiscal\Services\TaxEngineService;
use App\Jobs\IssueInvoiceJob;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\ServiceItem;
use App\Services\ImpersonationManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceWebController extends Controller
{
    public function __construct(
        private readonly ImpersonationManager $impersonationManager,
        private readonly TaxEngineService $taxEngine
    ) {}

    public function index(Request $request): Response
    {
        $companyId = $this->impersonationManager->getActiveCompanyId();

        $query = Invoice::query();
        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                  ->orWhere('borrower_snapshot->name', 'like', "%{$search}%")
                  ->orWhere('borrower_snapshot->tax_id', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $invoices = $query->latest('id')->paginate(15)->withQueryString();

        // Mapeia para o formato que a tabela espera
        $invoices->getCollection()->transform(function ($invoice) {
            $borrower = $invoice->borrower_snapshot ?? [];
            return [
                'id' => $invoice->id,
                'number' => $invoice->number,
                'series' => $invoice->series ?? '1',
                'status' => $invoice->status instanceof \BackedEnum ? $invoice->status->value : (string) $invoice->status,
                'amount' => number_format((float) $invoice->service_amount, 2, ',', '.'),
                'net_amount' => number_format((float) $invoice->net_amount, 2, ',', '.'),
                'borrower_name' => $borrower['name'] ?? 'Não informado',
                'borrower_document' => $borrower['tax_id'] ?? $borrower['document'] ?? '',
                'created_at' => $invoice->created_at?->format('d/m/Y H:i') ?? '-',
                'xml_url' => $invoice->xml_url,
                'pdf_url' => $invoice->pdf_url,
                'tracking_id' => $invoice->tracking_id,
            ];
        });

        return Inertia::render('Invoices/Index', [
            'invoices' => $invoices,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create(): Response
    {
        $companyId = $this->impersonationManager->getActiveCompanyId();
        $company = $companyId ? Company::find($companyId) : null;

        $services = $companyId
            ? ServiceItem::where('company_id', $companyId)->get()
            : collect([]);

        $customers = $companyId
            ? Customer::where('company_id', $companyId)->latest('id')->take(50)->get()
            : collect([]);

        return Inertia::render('Invoices/Create', [
            'company' => $company ? [
                'id' => $company->id,
                'name' => $company->name,
                'hasCertificate' => $company->certificates()->where('expires_at', '>', now())->exists(),
                'fiscal_driver' => $company->fiscal_driver ?? 'acbr',
            ] : null,
            'services' => $services,
            'customers' => $customers,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'borrower_document' => ['required', 'string'],
            'borrower_name' => ['required', 'string'],
            'service_item_id' => ['nullable'],
            'description' => ['required', 'string'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'iss_rate' => ['nullable', 'numeric'],
            'iss_withheld' => ['nullable', 'boolean'],
        ]);

        $companyId = $this->impersonationManager->getActiveCompanyId();
        $company = Company::findOrFail($companyId);

        $amount = (float) $validated['amount'];
        $issRate = (float) ($validated['iss_rate'] ?? 2.0);
        $issRate = max(2.0, min(5.0, $issRate));

        // Cálculo via Motor Fiscal
        $dto = new CanonicalInvoiceDTO(
            serviceValue: $amount,
            issRate: $issRate,
            allowRetention: true,
            opSimpNac: 1,
            issWithheldByTomador: (bool) ($validated['iss_withheld'] ?? false)
        );

        $calculation = $this->taxEngine->calculate($dto);

        // Snapshot do Tomador
        $borrowerSnapshot = [
            'tax_id' => $validated['borrower_document'],
            'name' => $validated['borrower_name'],
            'email' => $request->input('borrower_email'),
            'address' => $request->input('borrower_address', []),
        ];

        // Snapshot Fiscal
        $issSnapshot = [
            'rate' => $issRate,
            'value' => $calculation->iss->value,
            'withheld' => $calculation->iss->isRetained,
        ];

        $federalSnapshot = [
            'irrf' => $calculation->irrf->value,
            'csrf' => $calculation->csrf->totalValue,
            'inss' => $calculation->inss->value,
            'pis' => $calculation->csrf->pisValue,
            'cofins' => $calculation->csrf->cofinsValue,
            'csll' => $calculation->csrf->csllValue,
            'dispensed_by_adr005' => $calculation->irrf->dispensedByAdr005 || $calculation->csrf->dispensedByAdr005,
        ];

        $invoice = Invoice::create([
            'company_id' => $company->id,
            'issuing_office_id' => $company->office_id,
            'status' => 'DRAFT',
            'series' => '1',
            'service_amount' => $amount,
            'deductions_amount' => 0.0,
            'net_amount' => $calculation->netValue,
            'borrower_snapshot' => $borrowerSnapshot,
            'iss_snapshot' => $issSnapshot,
            'federal_taxes_snapshot' => $federalSnapshot,
        ]);

        // Dispara o Job assíncrono de emissão
        IssueInvoiceJob::dispatch($invoice->id);

        return redirect()->route('invoices.show', $invoice->id)
            ->with('success', 'Nota Fiscal gerada com sucesso e enviada para autorização.');
    }

    public function show(string $id): Response
    {
        $invoice = Invoice::findOrFail($id);

        return Inertia::render('Invoices/Show', [
            'invoice' => [
                'id' => $invoice->id,
                'number' => $invoice->number,
                'series' => $invoice->series,
                'status' => $invoice->status instanceof \BackedEnum ? $invoice->status->value : (string) $invoice->status,
                'service_amount' => number_format((float) $invoice->service_amount, 2, ',', '.'),
                'net_amount' => number_format((float) $invoice->net_amount, 2, ',', '.'),
                'created_at' => $invoice->created_at?->format('d/m/Y H:i:s') ?? '-',
                'borrower' => $invoice->borrower_snapshot,
                'iss' => $invoice->iss_snapshot,
                'federals' => $invoice->federal_taxes_snapshot,
                'xml_url' => $invoice->xml_url,
                'pdf_url' => $invoice->pdf_url,
                'tracking_id' => $invoice->tracking_id,
                'cancellation_reason' => $invoice->cancellation_reason,
                'cancelled_at' => $invoice->cancelled_at,
            ],
        ]);
    }
}
