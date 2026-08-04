<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Support\CurrentBranch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BranchContextController extends Controller
{
    /**
     * Ask which branch this session is working in.
     *
     * Reached only through EnsureBranchChosen. Once a choice exists this
     * becomes a pass-through, which is also what returns the user to wherever
     * they were headed: switch() sends them back here, and here sends them on.
     */
    public function choose(CurrentBranch $currentBranch): Response|RedirectResponse
    {
        $user = auth()->user();

        if (! $currentBranch->mustChoose()) {
            return redirect()->intended($this->landing());
        }

        return Inertia::render('Branches/Choose', [
            'branches' => Branch::where('company_id', $user->company_id)
                ->orderBy('name')
                ->get(['id', 'name', 'city', 'address', 'phone']),
            'company' => $user->company?->name,
        ]);
    }

    /** Where a user starts once they have a branch. */
    private function landing(): string
    {
        return in_array(auth()->user()->role, ['admin', 'manager'], true)
            ? route('dashboard', absolute: false)
            : route('cart.sales', absolute: false);
    }

    /**
     * Set the active branch for the current session.
     *
     * Only admins/managers may switch. The target must be a branch in the user's
     * company or the "all" sentinel; anything else is rejected.
     */
    public function switch(Request $request, CurrentBranch $currentBranch): RedirectResponse
    {
        abort_unless($currentBranch->canSwitch(), 403);

        $validated = $request->validate([
            'branch_id' => 'required',
        ]);

        $value = $validated['branch_id'];

        if ($value === CurrentBranch::ALL) {
            session([CurrentBranch::SESSION_KEY => CurrentBranch::ALL]);
        } else {
            abort_unless($currentBranch->isValidBranch((int) $value), 403);
            session([CurrentBranch::SESSION_KEY => (int) $value]);
        }

        return back();
    }
}
