<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Models\StoreProduct;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StoreProductController extends Controller
{
    public function index(): Response
    {
        $products = StoreProduct::paginate(25);
        if(request()->get('search')) {
            $products = StoreProduct::search(request()->get('search'))->paginate(25);
        }
        return Inertia::render('Stores/Products/Index', [
            'products' => $products,
        ]);
    }


    public function store(StoreProductRequest $request)
    {
        StoreProduct::create($request->validated());
        return back();
    }


    public function update(StoreProductRequest $request, StoreProduct $storeProduct)
    {
        $storeProduct->update($request->validated());

        return back();
    }


    public function transfers()
    {
        return Inertia::render('Stores/Transfers/Index', [
            "products" => StoreProduct::paginate(10),
        ]);
    }
}

