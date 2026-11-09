<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleWebController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Schedules/Index', [
            'schedules' => [
                'data' => []
            ]
        ]);
    }
}