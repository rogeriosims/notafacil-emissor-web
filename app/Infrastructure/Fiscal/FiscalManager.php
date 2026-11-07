<?php

declare(strict_types=1);

namespace App\Infrastructure\Fiscal;

use Illuminate\Support\Manager;
use App\Infrastructure\Fiscal\Adapters\AcbrFiscalAdapter;
use App\Infrastructure\Fiscal\Adapters\CrawlerFiscalAdapter;
use App\Infrastructure\Fiscal\Adapters\MockFiscalAdapter;

class FiscalManager extends Manager
{
    /**
     * Get the default driver name.
     *
     * @return string
     */
    public function getDefaultDriver(): string
    {
        return $this->config->get('fiscal.default') ?? 'mock';
    }

    /**
     * Create an instance of the Acbr driver.
     *
     * @return \App\Infrastructure\Fiscal\Adapters\AcbrFiscalAdapter
     */
    public function createAcbrDriver(): AcbrFiscalAdapter
    {
        return new AcbrFiscalAdapter($this->config->get('fiscal.drivers.acbr', []));
    }

    /**
     * Create an instance of the Crawler driver.
     *
     * @return \App\Infrastructure\Fiscal\Adapters\CrawlerFiscalAdapter
     */
    public function createCrawlerDriver(): CrawlerFiscalAdapter
    {
        return new CrawlerFiscalAdapter($this->config->get('fiscal.drivers.crawler', []));
    }

    /**
     * Create an instance of the Mock driver.
     *
     * @return \App\Infrastructure\Fiscal\Adapters\MockFiscalAdapter
     */
    public function createMockDriver(): MockFiscalAdapter
    {
        return new MockFiscalAdapter();
    }
}
