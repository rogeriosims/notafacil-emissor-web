<?php

declare(strict_types=1);

namespace Tests\Unit\Infrastructure\Fiscal;

use App\Infrastructure\Fiscal\Adapters\CrawlerFiscalAdapter;
use App\Infrastructure\Fiscal\Adapters\MockFiscalAdapter;
use App\Infrastructure\Fiscal\FiscalManager;
use App\Models\Company;
use Tests\TestCase;
use InvalidArgumentException;

uses(TestCase::class)->group('SPECSFY: AC-001', 'SPECSFY: FR-001', 'fiscal');

beforeEach(function () {
    config()->set('fiscal.default', 'mock');
});

test('Resolução do driver padrão configurado no ambiente', function () {
    /** @var FiscalManager $manager */
    $manager = app(FiscalManager::class);

    $driver = $manager->driver();

    expect($driver)->toBeInstanceOf(MockFiscalAdapter::class);
});

test('Resolução explícita de driver por empresa', function () {
    $company = new Company(['fiscal_driver' => 'crawler']);

    /** @var FiscalManager $manager */
    $manager = app(FiscalManager::class);

    $driver = $manager->driver($company->fiscal_driver);

    expect($driver)->toBeInstanceOf(CrawlerFiscalAdapter::class);
});

test('Lançamento de exceção para driver desconhecido', function () {
    /** @var FiscalManager $manager */
    $manager = app(FiscalManager::class);

    $manager->driver('provedor_invalido');
})->throws(InvalidArgumentException::class);

