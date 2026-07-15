<?php

namespace App\Http\Controllers;

use App\Support\CurrentBranch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class BranchContextController extends Controller
{
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
