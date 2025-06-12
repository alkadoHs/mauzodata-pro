<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function index()
    {
        return Inertia::render('Suppliers/Index', [
            'suppliers' => Supplier::where('company_id', auth()->user()->company_id)->latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
        ]);

        Supplier::create([
            'company_id' => auth()->user()->company_id,
            ...$validated
        ]);

        return back()->with('success', 'Supplier created.');
    }
}