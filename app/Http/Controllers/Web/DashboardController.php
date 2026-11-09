<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Dashboard/Index');
    }
}