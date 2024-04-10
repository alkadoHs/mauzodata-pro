<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Mccarlosen\LaravelMpdf\Facades\LaravelMpdf;

class InvoiceController extends Controller
{
    public function download(int $id)
    {
         $order = Order::where('id', $id)->with(['customer', 'user', 'branch', 'orderItems.product'])->first();

          $pdf = LaravelMpdf::loadView('pdfs.invoice', ['order' => $order]);

          return $pdf->stream('document.pdf');
    }
}
