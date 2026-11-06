<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\ImpersonationManager;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->scoped(ImpersonationManager::class, function ($app) {
            return new ImpersonationManager();
        });
    }

    public function boot(): void
    {
        //
    }
}
