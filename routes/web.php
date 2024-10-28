<?php

use App\Http\Controllers\BranchController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\CreditSalePaymentController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\NewStockController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderItemController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\StoreProductController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VendorProductController;
use App\Http\Controllers\StockTransferController;
use App\Http\Middleware\RemoveCommaFromInput;
use App\Models\Product;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    $total = Product::select(DB::raw('SUM(stock * buy_price)  as value'))->first()?->value;

    return Inertia::render('Dashboard', ['productsValue' => $total]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::resource('users', UserController::class)
    ->only(['index', 'create', 'store'])
    ->middleware(['auth']);

Route::resource('companies', CompanyController::class)
    ->only(['index', 'create', 'store'])
    ->middleware(['auth']);

Route::resource('branches', BranchController::class)
    ->only(['index', 'create', 'show', 'store'])
    ->middleware(['auth']);

Route::resource('products', ProductController::class)
    ->only(['index', 'store', 'show', 'edit', 'update', 'destroy'])
    ->middleware(['auth', 'verified', RemoveCommaFromInput::class]);


// cart area 
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
    Route::post('/cart/add', [CartController::class, 'add'])->name('cart.add');
    Route::patch('/cart/update/{cartItem}', [CartController::class, 'update'])
        ->name('cart.update')
        ->middleware([RemoveCommaFromInput::class]);
    Route::delete('/cart/remove/{cartItem}', [CartController::class, 'remove'])->name('cart.remove');
    Route::post('/cart/customer', [CartController::class, 'addCustomer'])->name('cart.addCustomer');

    Route::get('/cart/sales', [CartController::class, 'sales'])->name('cart.sales');
    Route::get('/cart/pricing', [CartController::class, 'pricing'])->name('cart.pricing');
    Route::get('/cart/credits', [CartController::class, 'credit_sales'])->name('cart.credits');
    Route::get('/cart/expenses', [CartController::class, 'expenses'])->name('cart.expenses');
});

// orders
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
    Route::post('/orders', [OrderController::class, 'complete'])->name('orders.complete')->middleware([RemoveCommaFromInput::class]);
    Route::get('/orders/view', [OrderController::class, 'preview'])->name('orders.preview');
    Route::get('/orders/invoices', [OrderController::class, 'invoices'])->name('orders.invoices');
    Route::get('/orders/invoices/{invoice}', [OrderController::class, 'invoice'])->name('orders.invoice');
    Route::delete('/orders/items/{orderItem}', [OrderItemController::class, 'destroy'])->name('orders.items.destroy');
    Route::delete('/orders/{order}', [OrderController::class, 'destroy'])->name('orders.destroy');
});

// pdfs 
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/invoices/download/{id}', [InvoiceController::class, 'download'])->name('invoices.download');
});

// credits
Route::middleware(['auth', 'verified', RemoveCommaFromInput::class,])->group(function () {
    Route::post('/credits/{creditSale}', [CreditSalePaymentController::class, 'add_payment'])->name('credits.payment');
});

// expenses
Route::middleware(['auth', 'verified', RemoveCommaFromInput::class])->group(function () {
    Route::get('/expenses', [ExpenseController::class, 'index'])->name('expenses.index');
    Route::post('/expenses', [ExpenseController::class, 'store'])->name('expenses.store');
});

// customers 
Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('/customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');
});

// store routes 
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/stores/products', [StoreProductController::class, 'index'])->name('stores.products');
    Route::get('/stores/transfers', [StoreProductController::class, 'transfers'])->name('stores.transfers');
    Route::post('/stores/products', [StoreProductController::class, 'store'])->name('stores.products.store');
    Route::patch('/stores/products/{storeProduct}', [StoreProductController::class, 'update'])->name('stores.products.update');
});

// reports
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/reports/sales', [ReportController::class, 'user_sales'])->name('reports.sales');
    Route::get('/reports/outstock', [ReportController::class, 'out_stock'])->name('reports.outstock');
    Route::get('/reports/zerostock', [ReportController::class, 'empty_stock'])->name('reports.zerostock');
    Route::get('/reports/expenses', [ReportController::class, 'expenses'])->name('reports.expenses');
    Route::get('/reports/expenses/{expense}/items', [ReportController::class, 'expense_items'])->name('reports.expenseitems');
    Route::get('/reports/stock-transfers', [ReportController::class, 'stock_transfers'])->name('reports.stocktransfers');
    Route::get('/reports/new-stocks', [ReportController::class, 'new_stocks'])->name('reports.newstocks');
    Route::get('/reports/inventory', [ReportController::class, 'inventory'])->name('reports.inventory');
});

// new stocks
Route::middleware(['auth', 'verified'])->controller(NewStockController::class)->group(function () {
    Route::get('/new-stocks', 'index')->name('newstocks.index');
    Route::post('/new-stocks/create', 'store')->name('newstocks.store');
});


//vendors
Route::middleware(['auth', 'verified'])->controller(VendorProductController::class)->group(function () {
    Route::get('/vendor-products', 'index')->name('vendorproducts.index');
    Route::post('/vendor-products', 'store')->name('vendorproducts.store');
    Route::patch('/vendor-products/{vendorProduct}', 'update')->name('vendorproducts.update');
    Route::post('/vendor-products/{vendorProduct}/confirm', 'confirm_stock')->name('vendorproducts.confirm');
});

// products transfer
Route::middleware(['auth', 'verified'])->controller(StockTransferController::class)->group(function () {
   Route::get('/stock-transfer', 'index')->name('stocktransfer.index');
   Route::post('/stock-tranfer', 'store')->name('stocktransfer.store');
   Route::patch('/stock-tranfer/{product}', 'update')->name('stocktransfer.update');
   Route::post('/stock-tranfer/{product}/confirm', 'confirm')->name('stocktransfer.confirm');
});

// payment methods
Route::middleware(['auth', 'verified'])->controller(PaymentMethodController::class)->group(function () {
    Route::get('/payments','index')->name('payments.index');
    Route::post('/payments','store')->name('payments.store');
    Route::delete('/payments/{paymentMethod}/delete', 'destroy')->name('payments.destroy');
});

require __DIR__.'/auth.php';
