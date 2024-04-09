<?php

use App\Http\Controllers\CartController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Middleware\RemoveCommaFromInput;
use Illuminate\Foundation\Application;
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
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::resource('products', ProductController::class)
    ->only(['index', 'store', 'view', 'update', 'destroy'])
    ->middleware(['auth', 'verified', RemoveCommaFromInput::class]);

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

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/orders', [OrderController::class, 'complete'])->name('orders.complete');
});


require __DIR__.'/auth.php';
