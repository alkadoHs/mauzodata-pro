<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    public function index()
    {
        return "";
    }
    

    public function create(): Response
    {
        return Inertia::render('Auth/CreateCompany');
    }


    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
        ]);

        auth()->user()->company()->create($validated);

        return back();
    }
}
