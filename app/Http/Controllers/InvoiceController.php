<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Mccarlosen\LaravelMpdf\Facades\LaravelMpdf;

class InvoiceController extends Controller
{
    public function download(Request $request, int $id): Response
    {
        // branch.company: the receipt falls back to the company's address and
        // phone when the branch has none of its own.
        $order = Order::where('id', $id)
            ->with(['customer', 'user', 'branch.company', 'orderItems.product'])
            ->firstOrFail();

        return Inertia::render('Invoices/Index', [
            'invoice' => $order,
            // Where the seller lands once the print dialog closes. A sale that
            // was just rung up goes back to the till ready for the next
            // customer; a reprint opened from the invoice screen returns there.
            'returnTo' => $request->query('from') === 'invoice'
                ? route('orders.invoice', $order->id)
                : route('cart.index'),
        ]);
    }
}
