<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\User;
use Hash;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Users/Index', [
            'users' => User::where('company_id', auth()->user()->company_id)->get(),
            'branches' => Branch::where('company_id', auth()->user()->company_id)->get(),
        ]);
    }

    
    public function create(): Response
    {
        return Inertia::render('Users/Create');
    }


    public function store(Request $request)
    {
        $request->validate([
            'branch_id' => 'required',
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'phone' => 'required|string|max:13|unique:'.User::class,
            'role' => 'required',
            'password' => ['required', 'max:255'],
        ]);


        $user = User::create([
            'company_id' => auth()->user()->company_id,
            'branch_id' => $request->branch_id,
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        return back();
    }
}
