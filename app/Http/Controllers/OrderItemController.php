<?php

namespace App\Http\Controllers;

use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;

class OrderItemController extends Controller
{
    public function destroy(OrderItem $orderItem)
    {
        $product = Product::find($orderItem->product_id);
        // restore the products stock
        $product->increment("stock", $orderItem->quantity);

        $orderItem->delete();
        return back();
    }
}
