<?php

namespace App\Http\Controllers;

use App\Models\NewStock;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Response;
use Inertia\Inertia;

class NewStockController extends Controller
{
    public function index(): Response
    {
        // NewStock is scoped to the active branch through its product.
        $newStocks = NewStock::with('product:id,name,unit')
            ->whereDate('created_at', today())
            ->latest()
            ->get();

        return Inertia::render('Stocks/Index', [
            'newStocks' => $newStocks,
            'total' => (float) $newStocks->sum('new_stock'),
            'products' => Product::orderBy('name')->get(['id', 'name', 'unit', 'stock', 'stock_alert']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'new_stock' => 'required|numeric|min:-99999999|max:99999999|not_in:0',
        ]);

        // Branch-scoped: a product outside the active branch won't resolve.
        $product = Product::find($validated['product_id']);

        if (! $product) {
            return back()->withErrors([
                'product_id' => 'That product is not available in this branch.',
            ]);
        }

        DB::transaction(function () use ($validated, $product) {
            // One row per product per day — top it up if it already exists.
            $newStock = NewStock::where('product_id', $product->id)
                ->whereDate('created_at', today())
                ->lockForUpdate()
                ->first();

            if ($newStock) {
                $newStock->increment('new_stock', $validated['new_stock']);
            } else {
                NewStock::create([
                    'product_id' => $product->id,
                    'new_stock' => $validated['new_stock'],
                    // Stock level *before* today's first top-up.
                    'stock' => $product->stock,
                ]);
            }

            $product->increment('stock', $validated['new_stock']);
        });

        $product->refresh();

        return back()->with(
            'success',
            "Stock adjusted for {$product->name} — now {$product->stock} {$product->unit}."
        );
    }
}
