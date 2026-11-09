<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Models\ServiceCode;
use App\Models\ServiceItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class TaxSettingsController extends Controller
{
    public function index(): Response
    {
        $totalCodes = ServiceCode::count();
        $totalItems = ServiceItem::count();
        $recentCodes = ServiceCode::orderBy('code')->take(30)->get();

        return Inertia::render('Management/TaxSettings/Index', [
            'stats' => [
                'total_codes' => $totalCodes,
                'total_items' => $totalItems,
            ],
            'recent_codes' => $recentCodes,
        ]);
    }

    public function importCsv(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:10240'], // max 10MB
        ]);

        $file = $request->file('file');
        $rawContent = file_get_contents($file->getRealPath());

        // Converte de ISO-8859-1 para UTF-8 se necessário
        if (!mb_check_encoding($rawContent, 'UTF-8')) {
            $rawContent = mb_convert_encoding($rawContent, 'UTF-8', 'ISO-8859-1');
        }

        $lines = preg_split('/\r\n|\r|\n/', $rawContent);
        $importedCount = 0;

        foreach ($lines as $index => $line) {
            $line = trim($line);
            if (empty($line)) {
                continue;
            }

            // Ignora cabeçalhos
            if ($index === 0 && (stripos($line, 'codigo') !== false || stripos($line, 'code') !== false || stripos($line, 'descri') !== false)) {
                continue;
            }

            // Suporta delimitador ponto-e-vírgula ou vírgula
            $cols = str_contains($line, ';') ? explode(';', $line) : str_getcsv($line);

            if (count($cols) >= 2) {
                $code = trim($cols[0]);
                $description = trim($cols[1]);
                $minRate = isset($cols[2]) && is_numeric(str_replace(',', '.', trim($cols[2]))) ? (float) str_replace(',', '.', trim($cols[2])) : 2.0;
                $maxRate = isset($cols[3]) && is_numeric(str_replace(',', '.', trim($cols[3]))) ? (float) str_replace(',', '.', trim($cols[3])) : 5.0;

                // Remove aspas
                $description = trim($description, " \t\n\r\0\x0B\"'");

                if (!empty($code) && !empty($description)) {
                    ServiceCode::updateOrCreate(
                        ['code' => $code],
                        [
                            'description' => $description,
                            'min_rate' => max(2.0, min(5.0, $minRate)),
                            'max_rate' => max(2.0, min(5.0, $maxRate)),
                        ]
                    );
                    $importedCount++;
                }
            }
        }

        return back()->with('success', "Importação concluída com sucesso! {$importedCount} códigos fiscais foram cadastrados/atualizados.");
    }

    public function seedDefaults(): RedirectResponse
    {
        $defaults = [
            ['1.01', 'Análise e desenvolvimento de sistemas.', 2.0, 5.0],
            ['1.02', 'Programação.', 2.0, 5.0],
            ['1.03', 'Processamento, armazenamento ou hospedagem de dados, textos, imagens, vídeos.', 2.0, 5.0],
            ['1.04', 'Elaboração de programas de computadores, inclusive de jogos eletrônicos.', 2.0, 5.0],
            ['1.05', 'Licenciamento ou cessão de direito de uso de programas de computação.', 2.0, 5.0],
            ['1.06', 'Assessoria e consultoria em informática.', 2.0, 5.0],
            ['1.07', 'Suporte técnico em informática, inclusive instalação, configuração e manutenção.', 2.0, 5.0],
            ['1.08', 'Planejamento, confecção, manutenção e atualização de páginas eletrônicas.', 2.0, 5.0],
            ['1.09', 'Disponibilização, sem cessão definitiva, de conteúdos de áudio, vídeo, imagem e texto por meio da internet.', 2.0, 5.0],
            ['7.01', 'Engenharia, agronomia, agrimensura, arquitetura, geologia, urbanismo, paisagismo e congêneres.', 2.0, 5.0],
            ['7.02', 'Execução, por administração, empreitada ou subempreitada, de obras de construção civil, hidráulica ou elétrica.', 2.0, 5.0],
            ['7.03', 'Elaboração de planos diretores, estudos de viabilidade, estudos organizacionais e outros.', 2.0, 5.0],
            ['10.05', 'Agenciamento, corretagem ou intermediação de bens móveis ou imóveis, não abrangidos em outros itens.', 2.0, 5.0],
            ['14.01', 'Lubrificação, limpeza, lustração, revisão, carga e recarga, conserto, restauração, blindagem, manutenção e conservação de máquinas.', 2.0, 5.0],
            ['17.01', 'Assessoria ou consultoria de qualquer natureza, não contida em outros itens desta lista.', 2.0, 5.0],
            ['17.02', 'Datilografia, digitação, estenografia, expediente, secretaria em geral, resposta audível, redação, edição, interpretação.', 2.0, 5.0],
            ['17.06', 'Propaganda e publicidade, inclusive promoção de vendas, planejamento de campanhas ou sistemas de publicidade.', 2.0, 5.0],
            ['17.12', 'Veiculação e divulgação de textos, desenhos e outros materiais de propaganda e publicidade, por qualquer meio.', 2.0, 5.0],
            ['17.14', 'Advocacia.', 2.0, 5.0],
            ['17.16', 'Auditoria.', 2.0, 5.0],
            ['17.19', 'Contabilidade, inclusive serviços técnicos e auxiliares.', 2.0, 5.0],
            ['17.20', 'Consultoria e assessoria econômica ou financeira.', 2.0, 5.0],
            ['25.01', 'Serviços funerários.', 2.0, 5.0],
            ['35.01', 'Serviços de reportagem, assessoria de imprensa, jornalismo e relações públicas.', 2.0, 5.0],
        ];

        foreach ($defaults as $item) {
            ServiceCode::updateOrCreate(
                ['code' => $item[0]],
                [
                    'description' => $item[1],
                    'min_rate' => $item[2],
                    'max_rate' => $item[3],
                ]
            );
        }

        return back()->with('success', 'Catálogo oficial de itens da Lei Complementar 116/2003 povoado com sucesso.');
    }
}
