<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Default Fiscal Driver
    |--------------------------------------------------------------------------
    |
    | This option controls the default fiscal "driver" that will be used on
    | requests. By default, it is set to "mock" for tests, but you can set
    | this in your .env file to "acbr" or "crawler" for production.
    |
    | Supported: "acbr", "crawler", "mock"
    |
    */

    'default' => env('FISCAL_DEFAULT_DRIVER', 'mock'),

    /*
    |--------------------------------------------------------------------------
    | Drivers Configuration
    |--------------------------------------------------------------------------
    |
    | Here you can configure the settings for the different drivers.
    |
    */

    'drivers' => [
        'acbr' => [
            'base_url' => env('ACBR_BASE_URL', 'http://acbr:8000/v1/nfse'),
            'token' => env('ACBR_API_TOKEN', ''),
            'timeout' => 15,
        ],

        'crawler' => [
            'base_url' => env('CRAWLER_BASE_URL', 'http://127.0.0.1:8000/api'),
            'api_key' => env('CRAWLER_API_KEY', ''),
            'timeout' => 15,
        ],
    ],
];
