<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\ExpenseItem;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('Expenses/Index', [
            'users' => User::where('id', auth()->id())->orWhere('role', 'vendor')->get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // find if user has expenses today
        $expense = Expense::where('user_id', auth()->id())->whereDate('created_at', today())->first();

        // if exist add expense items into it else create new one and then add items
        if($expense) {
            $expense->expenseItems()->createMany($request->post('expenses'));
        } else {
            $newExpense = Expense::create(['user_id' => $request->user_id]);
            $newExpense->expenseItems()->createMany($request->post('expenses'));
        }

        return back();
    }

    /**
     * Display the specified resource.
     */
    public function show(Expense $expense)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Expense $expense)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Expense $expense)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Expense $expense)
    {
        //
    }
}
