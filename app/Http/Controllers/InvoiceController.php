<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Mccarlosen\LaravelMpdf\Facades\LaravelMpdf;

class InvoiceController extends Controller
{
    public function download(int $id): Response
    {
        // branch.company: the receipt falls back to the company's address and
        // phone when the branch has none of its own.
        $order = Order::where('id', $id)
            ->with(['customer', 'user', 'branch.company', 'orderItems.product'])
            ->firstOrFail();

        return Inertia::render('Invoices/Index', ['invoice' => $order]);
    }
}
