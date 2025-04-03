<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\ProductTransfer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductTransferController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $productTransfers = ProductTransfer::with('branch', 'user')->withCount('productTransferItems')->get();

        return Inertia::render('ProductTransfers/Index', [
            'productTransfers' => $productTransfers,
            'filters' => [
                'search' => request()->input('search', ''),
                'status' => request()->input('status', ''),
                'date' => request()->input('date', ''),
                'branch' => request()->input('branch', ''),
            ],
            'branches' => Branch::get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(ProductTransfer $productTransfer)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ProductTransfer $productTransfer)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ProductTransfer $productTransfer)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ProductTransfer $productTransfer)
    {
        //
    }
}
