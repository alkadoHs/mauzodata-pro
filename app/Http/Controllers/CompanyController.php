<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Support\CurrentBranch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    public function index()
    {
        return "";
    }

    public function create(): Response
    {
        return Inertia::render('Auth/CreateCompany');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
        ]);

        auth()->user()->company()->create($validated);

        return back();
    }

    /**
     * Company settings. Always the caller's own company — never an id from the
     * request.
     */
    public function edit(): Response
    {
        $this->authorizeManager();

        return Inertia::render('Settings/Company', [
            'company' => auth()->user()->company,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $this->authorizeManager();

        $company = auth()->user()->company;
        abort_unless($company, 404);

        $validated = $request->validate([
            // `name` is UNIQUE at the database level — validate so a clash is a
            // field error rather than a SQL error.
            'name' => ['required', 'string', 'max:50', Rule::unique('companies', 'name')->ignore($company->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'tax_id' => ['nullable', 'string', 'max:50'],
        ]);

        $company->update($validated);

        return back()->with('success', 'Company settings saved.');
    }

    private function authorizeManager(): void
    {
        abort_unless(app(CurrentBranch::class)->canSwitch(), 403);
    }
}
