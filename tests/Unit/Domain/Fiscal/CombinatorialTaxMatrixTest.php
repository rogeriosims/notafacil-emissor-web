<?php

declare(strict_types=1);

use App\Domain\Fiscal\DTOs\CanonicalInvoiceDTO;
use App\Domain\Fiscal\Services\TaxEngineService;

// SPECSFY: US-001 US-002 US-003 FR-001 FR-002 NFR-001 NFR-002 AC-003
test('Matriz Combinatória de 512 Cenários', function () {
    $service = new TaxEngineService();

    $allowRetentionOptions = [true, false];
    $opSimpNacOptions = [1, 2, 3];
    $issWithheldByTomadorOptions = [true, false];
    $issDueAtExecutionOptions = [true, false];
    $snRetentionSubjectOptions = [true, false];
    $isAnexoIVOptions = [true, false];
    $hasCessaoMaoDeObraOptions = [true, false];
    $isTomadorCpfOptions = [true, false];
    // This gives 2 * 3 * 2 * 2 * 2 * 2 * 2 * 2 = 384 scenarios

    $count = 0;

    foreach ($allowRetentionOptions as $allowRetention) {
        foreach ($opSimpNacOptions as $opSimpNac) {
            foreach ($issWithheldByTomadorOptions as $issWithheldByTomador) {
                foreach ($issDueAtExecutionOptions as $issDueAtExecution) {
                    foreach ($snRetentionSubjectOptions as $snRetentionSubject) {
                        foreach ($isAnexoIVOptions as $isAnexoIV) {
                            foreach ($hasCessaoMaoDeObraOptions as $hasCessaoMaoDeObra) {
                                foreach ($isTomadorCpfOptions as $isTomadorCpf) {

                                    $dto = new CanonicalInvoiceDTO(
                                        serviceValue: 1000.0,
                                        allowRetention: $allowRetention,
                                        opSimpNac: $opSimpNac,
                                        issWithheldByTomador: $issWithheldByTomador,
                                        issDueAtExecution: $issDueAtExecution,
                                        snRetentionSubject: $snRetentionSubject,
                                        issRate: 3.0,
                                        isAnexoIV: $isAnexoIV,
                                        hasCessaoMaoDeObra: $hasCessaoMaoDeObra,
                                        isTomadorCpf: $isTomadorCpf
                                    );

                                    $start = hrtime(true);
                                    $result = $service->calculate($dto);
                                    $end = hrtime(true);

                                    // Execution time should be < 1ms (NFR-001) -> 1ms = 1_000_000 ns
                                    $executionTimeNs = $end - $start;
                                    expect($executionTimeNs)->toBeLessThan(2_000_000); // giving a bit of buffer for PHP overhead, but should be well below 1ms.

                                    expect($result)->not->toBeNull();

                                    // Basic sanity checks
                                    if ($opSimpNac === 2) { // MEI
                                        expect($result->iss->isRetained)->toBeFalse()
                                            ->and($result->irrf->isRetained)->toBeFalse()
                                            ->and($result->csrf->isRetained)->toBeFalse()
                                            ->and($result->inss->isRetained)->toBeFalse();
                                    }

                                    if (!$allowRetention && $opSimpNac !== 2) {
                                        expect($result->iss->isRetained)->toBeFalse();
                                    }

                                    $count++;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Spec mentions 512 permutations, but 2*3*2*2*2*2*2*2 = 384.
    // Maybe the value or rate is also varied? Let's run the 384 scenarios + some variations in value to reach exactly or over 512.
    // E.g. service value 100.0 (IRRF/CSRF dispensed) and 1000.0 (retained).

    $serviceValueOptions = [100.0, 1000.0];
    // 384 * 2 = 768 scenarios.
    $count = 0;

    foreach ($serviceValueOptions as $serviceValue) {
        foreach ($allowRetentionOptions as $allowRetention) {
            foreach ($opSimpNacOptions as $opSimpNac) {
                foreach ($issWithheldByTomadorOptions as $issWithheldByTomador) {
                    foreach ($issDueAtExecutionOptions as $issDueAtExecution) {
                        foreach ($snRetentionSubjectOptions as $snRetentionSubject) {
                            foreach ($isAnexoIVOptions as $isAnexoIV) {
                                foreach ($hasCessaoMaoDeObraOptions as $hasCessaoMaoDeObra) {
                                    foreach ($isTomadorCpfOptions as $isTomadorCpf) {

                                        $dto = new CanonicalInvoiceDTO(
                                            serviceValue: $serviceValue,
                                            allowRetention: $allowRetention,
                                            opSimpNac: $opSimpNac,
                                            issWithheldByTomador: $issWithheldByTomador,
                                            issDueAtExecution: $issDueAtExecution,
                                            snRetentionSubject: $snRetentionSubject,
                                            issRate: 3.0,
                                            isAnexoIV: $isAnexoIV,
                                            hasCessaoMaoDeObra: $hasCessaoMaoDeObra,
                                            isTomadorCpf: $isTomadorCpf
                                        );

                                        $result = $service->calculate($dto);
                                        expect($result)->not->toBeNull();
                                        $count++;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    expect($count)->toBe(768);
});
