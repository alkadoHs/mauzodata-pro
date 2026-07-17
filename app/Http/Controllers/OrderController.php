<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CreditSale;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(): Response
    {
        $startDate = request()->startDate ?? null;
        $endDate = request()->endDate ?? null;
        $search = request()->search ?? null;
        $userId = request()->user_id;

        $products_sold = OrderItem::query()
            ->with('product')
            ->select(
                'product_id',
                DB::raw('SUM(quantity) as total_qty'),
                DB::raw('SUM(total) as total_price'),
                DB::raw('SUM(total_buy_price) as total_buy_price'),
                DB::raw('SUM(profit) as total_profit'),
                DB::raw('MAX(created_at) as latest_created_at') // ✅ for ordering
            )
            ->when(!$startDate && !$endDate && !$userId, function (Builder $query) {
                return $query->whereDate('created_at', today());
            })
            ->when($userId, function (Builder $query) use ($userId) {
                return $query->whereRelation('order', 'user_id', $userId);
            })
            ->when($startDate, function (Builder $query) use ($startDate) {
                return $query->whereDate('created_at', '>=', $startDate);
            })
            ->when($endDate, function (Builder $query) use ($endDate) {
                return $query->whereDate('created_at', '<=', $endDate);
            })
            ->when($search, function (Builder $query) use ($search) {
                return $query->whereHas('product', function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%');
                });
            })
            ->groupBy('product_id') // ✅ only group by product_id
            ->orderByDesc('latest_created_at') // ✅ safe because it's aggregated
            ->get();

        $filters = [
            'dateBtn' => [
                'startDate' => $startDate,
                'endDate' => $endDate,
            ],
            'search' => $search,
        ];

        return Inertia::render('Sales/Index', [
            'filters' => $filters,
            'users' => User::get(),
            'products_sold' => $products_sold,
        ]);
    }



    public function complete(Request $request)
    {
        $validated = $request->validate([
            'status' => 'required|in:paid,credit',
            'paid' => 'nullable|numeric|min:0',
            'print_invoice' => 'nullable|boolean',
            'payment_method_id' => [
                'nullable',
                // Optional (a company may have no methods configured), but when
                // given it must belong to the caller's own company.
                Rule::exists('payment_methods', 'id')
                    ->where('company_id', auth()->user()->company_id),
            ],
        ]);

        $cart = Cart::with('cartItems.product')->first();

        if (! $cart || $cart->cartItems->isEmpty()) {
            return back()->withErrors(['cart' => 'Add at least one product before selling.']);
        }

        // A credit sale has to be owed by somebody.
        if ($validated['status'] === 'credit' && ! $cart->customer_id) {
            return back()->withErrors(['status' => 'Select a customer before making a credit sale.']);
        }

        $paid = (float) ($validated['paid'] ?? 0);

        DB::transaction(function () use ($validated, $cart, $paid) {
            // Built explicitly — this used to spread $request->all() into the model,
            // so status/paid/payment_method_id arrived unvalidated.
            $order = Order::create([
                'customer_id' => $cart->customer_id,
                'user_id' => auth()->id(),
                'status' => $validated['status'],
                'paid' => $paid,
                'payment_method_id' => $validated['payment_method_id'] ?? null,
                'print_invoice' => $validated['print_invoice'] ?? true,
            ]);

            foreach ($cart->cartItems as $item) {
                // Use the eager-loaded product (relation bypasses BranchScope) so
                // cross-branch line items still resolve; skip if truly missing.
                $product = $item->product;
                if (! $product) {
                    continue;
                }

                $order->orderItems()->create([
                    'product_id' => $item->product_id,
                    'buy_price' => $product->buy_price,
                    'price' => $item->price,
                    'quantity' => $item->quantity,
                ]);

                $product->decrement('stock', $item->quantity);
            }

            //if amount paid is less than total price add order to the credit sales
            if ($validated['status'] === 'credit') {
                $creditSale = $order->creditSale()->create([
                    'customer_id' => $order->customer_id
                ]);

                //take what has paid and add to credit payments
                $creditSale->creditSalePayments()->create(['amount' => $order->paid ?? 0.00 ]);
            }
    
            $cart->delete();
        });

        return redirect(route('orders.preview'));
    }


    public function preview()
    {
        $latesOrder = Order::where('user_id', auth()->id())->with(['customer', 'user', 'branch', 'orderItems.product'])->latest()->first();
        return Inertia::render('Orders/Preview', [
            'order' => $latesOrder,
        ]);
    }

    public function invoices(Request $request)
    {
        $search = trim((string) $request->input('search'));

        $orders = Order::query()
            ->with(['customer', 'user', 'orderItems.product'])
            ->withSum('orderItems as total_amount', 'total')
            ->when($search, function (Builder $query) use ($search) {
                // Grouped so the OR can't escape the branch scope's WHERE, and the
                // customer match actually uses LIKE — it compared with `=` against
                // "%term%" before, so searching by name never matched anything.
                $query->where(function (Builder $inner) use ($search) {
                    if (is_numeric($search)) {
                        $inner->where('id', (int) $search);
                    }
                    $inner->orWhereRelation('customer', 'name', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('Sales/Invoices', [
            'orders' => $orders,
            'filters' => ['search' => $search],
        ]);
    }

    public function invoice(Request $request, Order $invoice)
    {
        $currentOrder = Order::where('id', $invoice->id)->with(['customer', 'user', 'branch', 'orderItems.product'])->first();
        return Inertia::render('Orders/Invoice', [
            'order' => $currentOrder,
        ]);
    }

    public function destroy(Order $order): RedirectResponse
    {
        $order->delete();

        return redirect()->back();
    }
}
