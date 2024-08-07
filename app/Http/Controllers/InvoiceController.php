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
         $order = Order::where('id', $id)->with(['customer', 'user', 'branch', 'orderItems.product'])->first();

          return Inertia::render('Invoices/Index', ['invoice' => $order]);
    }
}
