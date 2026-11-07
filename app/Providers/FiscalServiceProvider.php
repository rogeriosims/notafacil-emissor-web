<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Infrastructure\Fiscal\FiscalManager;
use App\Domain\Fiscal\Contracts\FiscalProviderInterface;

class FiscalServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(FiscalManager::class, function ($app) {
            return new FiscalManager($app);
        });

        $this->app->bind(FiscalProviderInterface::class, function ($app) {
            return $app->make(FiscalManager::class)->driver();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
