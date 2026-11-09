<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class BatchWebController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Batches/Index', [
            'batches' => [
                'data' => []
            ]
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Batches/Create');
    }
}