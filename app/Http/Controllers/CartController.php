<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerRequest;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\CreditSale;
use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\User;
use App\Models\OrderItem;
use App\Support\CurrentBranch;
use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function index(): Response
    {
        // The product() relation bypasses BranchScope, so line items always resolve
        // their product even if it "belongs" to another branch (common in historical
        // cross-branch sales). The add-product list below stays branch-scoped.
        $cart = Cart::with(['cartItems.product', 'customer'])->firstOrCreate();

        return Inertia::render('Cart/Index', [
            'cart' => $cart,
            'total' => $cart->cartItems->reduce(fn ($acc, $item) => $acc + $item->quantity * $item->price, 0) ?? 0,
            'products' => Product::where('stock', '>', 0)->get(),
            'paymentMethods' => PaymentMethod::where('company_id', auth()->user()->company_id)->get(),
        ]);
    }

    public function add(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $product = Product::find($validated['product_id']);

        if (! $product) {
            return back()->withErrors(['product_id' => 'That product is not available in this branch.']);
        }

        $cart = Cart::firstOrCreate();

        // Scope the duplicate check to THIS cart. It used to query CartItem globally,
        // so another seller holding the same product silently blocked the add.
        $existing = $cart->cartItems()->where('product_id', $product->id)->first();

        if ($existing) {
            // Re-adding a product bumps the quantity (standard POS behaviour).
            $quantity = $existing->quantity + 1;

            if ($product->stock < $quantity) {
                return back()->withErrors([
                    'quantity' => "Only {$product->stock} {$product->unit} of {$product->name} left in stock.",
                ]);
            }

            $existing->update([
                'quantity' => $quantity,
                'price' => $this->priceFor($product, $quantity),
            ]);

            return back();
        }

        if ($product->stock < 1) {
            return back()->withErrors(['quantity' => "{$product->name} is out of stock."]);
        }

        $cart->cartItems()->create([
            'product_id' => $product->id,
            'quantity' => 1,
            'price' => $this->priceFor($product, 1),
        ]);

        return back();
    }

    public function update(Request $request, $item_id)
    {
        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0.01',
        ]);

        $quantity = (float) $validated['quantity'];

        // Scope to the caller's own cart — this used to be CartItem::find($id),
        // which let any user edit another seller's line by guessing an id.
        $cart = Cart::firstOrCreate();
        $item = $cart->cartItems()->find($item_id);

        if (! $item) {
            return back()->withErrors(['quantity' => 'That item is not in your cart.']);
        }

        // Relation bypasses BranchScope, so a cross-branch product still resolves.
        $product = $item->product;

        if (! $product) {
            return back()->withErrors(['quantity' => 'That product is no longer available.']);
        }

        if ($product->stock < $quantity) {
            return back()->withErrors([
                'quantity' => "Only {$product->stock} {$product->unit} left in stock.",
            ]);
        }

        $price = $this->priceFor($product, $quantity);
        $item->update(['quantity' => $quantity, 'price' => $price]);

        // 'info' is actually shared to the front end; the old 'message' key never was,
        // so sellers never saw why the price changed.
        if ($this->isWholesale($product, $quantity)) {
            return back()->with('info', "Wholesale price applied to {$product->name}.");
        }

        return back();
    }

    /**
     * Wholesale kicks in once the quantity reaches the product's threshold.
     */
    private function isWholesale(Product $product, float $quantity): bool
    {
        return $product->whole_sale > 0 && $quantity >= $product->whole_sale;
    }

    private function priceFor(Product $product, float $quantity): float
    {
        return $this->isWholesale($product, $quantity)
            ? (float) $product->whole_price
            : (float) $product->sale_price;
    }

    
    public function addCustomer(StoreCustomerRequest $request) {
        $cart = Cart::first();
        $customer = Customer::create([...$request->validated(), 'branch_id' => app(CurrentBranch::class)->writeBranchId()]);

        $cart->update(['customer_id' => $customer->id]);
        return back();
    }


    public function remove(Request $request, $item_id)
    {
        // Scoped to the caller's own cart (was CartItem::find, i.e. any seller's line).
        $cart = Cart::firstOrCreate();
        $cart->cartItems()->where('id', $item_id)->delete();

        return back();
    }

    /**
     * Take the customer off this sale. Deliberately does NOT delete the customer:
     * carts.customer_id and credit_sales.customer_id are ON DELETE CASCADE, so
     * deleting would wipe the in-progress cart and the customer's credit history.
     */
    public function removeCustomer()
    {
        Cart::firstOrCreate()->update(['customer_id' => null]);

        return back()->with('success', 'Customer removed from this sale.');
    }

    public function sales(): Response
    {
        $products_sold = OrderItem::with('product')
            ->select(
                'product_id',
                DB::raw('SUM(quantity) as total_qty'),
                DB::raw('SUM(total) as total_price'),
                DB::raw('MAX(created_at) as latest_created_at') // ✅ needed for ordering
            )
            ->whereRelation('order', 'user_id', auth()->id())
            ->whereDate('created_at', today())
            ->groupBy('product_id') // ✅ group only by product_id
            ->orderByDesc('latest_created_at') // ✅ safe because it's aggregated
            ->get();

        return Inertia::render('Sales/History', [
            'orders' => auth()->user()->orderItems()
                ->whereRelation('order', 'status', 'paid')
                ->whereDate('order_items.created_at', today())
                ->sum('total'),

            'payments' => auth()->user()->creditSalePayments()
                ->whereDate('created_at', today())
                ->sum('amount'),

            'expenses' => auth()->user()->expenseItems()
                ->whereDate('expense_items.created_at', today())
                ->sum('cost'),

            'products_sold' => $products_sold
        ]);
    }


    public function pricing(): Response
    {
       $products = Product::paginate(25);
        if(request()->get('search')) {
            $products = Product::search(request()->get('search'))->paginate(25);
        }
        return Inertia::render('Products/Pricing', [
            'products' => $products,
        ]);
    }


    public function credit_sales(Request $request): Response
    {
        $search = trim((string) $request->input('search'));

        // Admins/managers see the whole (active) branch; everyone else sees only
        // their own. This used to key off role === 'admin', which left managers
        // looking like sellers — and the search branch overwrote the user filter
        // entirely, so a searching seller saw everybody's credit sales.
        $seesAllSellers = app(CurrentBranch::class)->canSwitch();

        $creditSales = CreditSale::query()
            ->where('status', 'onprogresss')
            ->when(! $seesAllSellers, fn ($q) => $q->where('user_id', auth()->id()))
            ->when($search, fn ($q) => $q->whereRelation('customer', 'name', 'LIKE', "%{$search}%"))
            ->with([
                'user:id,name',
                'customer:id,name,contact',
                'creditSalePayments.user:id,name',
                // Totals come from SQL instead of shipping every order line.
                'order' => fn ($q) => $q->select('id', 'invoice_number', 'user_id', 'created_at')
                    ->withSum('orderItems as billed_total', 'total'),
            ])
            ->withSum('creditSalePayments as paid_total', 'amount')
            ->latest()
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Credits/UserCreditSales', [
            'creditSales' => $creditSales,
            'filters' => ['search' => $search],
            'scope' => $seesAllSellers ? 'branch' : 'mine',
            'outstandingTotal' => $this->outstandingTotal($seesAllSellers, $search),
        ]);
    }

    /**
     * Total still owed across every matching credit sale (not just this page).
     */
    private function outstandingTotal(bool $seesAllSellers, string $search): float
    {
        return (float) CreditSale::query()
            ->where('status', 'onprogresss')
            ->when(! $seesAllSellers, fn ($q) => $q->where('user_id', auth()->id()))
            ->when($search, fn ($q) => $q->whereRelation('customer', 'name', 'LIKE', "%{$search}%"))
            ->withSum('creditSalePayments as paid_total', 'amount')
            ->with(['order' => fn ($q) => $q->withSum('orderItems as billed_total', 'total')])
            ->get()
            ->sum(fn ($cs) => (float) ($cs->order->billed_total ?? 0) - (float) ($cs->paid_total ?? 0));
    }

    public function expenses(): Response
    {
        $items = auth()->user()->expenseItems()
            ->whereDate('expenses.created_at', today())
            ->select('expense_items.*')
            ->latest('expense_items.created_at')
            ->get();

        return Inertia::render('Expenses/UserExpenses', [
            'expenseItems' => $items,
            'total' => (float) $items->sum('cost'),
            // Yourself or one of your company's vendors (company-scoped).
            'users' => ExpenseController::loggableUsers(),
        ]);
    }
}

