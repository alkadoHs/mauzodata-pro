<?php

namespace App\Http\Controllers;

use App\Support\CurrentWorkspace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Opening the shop, or opening the haulage business.
 *
 * Mirrors BranchContextController: asked once through EnsureWorkspaceChosen,
 * changeable at any time afterwards from the switcher in the header.
 */
class WorkspaceContextController extends Controller
{
    public function choose(CurrentWorkspace $workspace): Response|RedirectResponse
    {
        if (! $workspace->mustChoose()) {
            return redirect($workspace->landingRoute($workspace->current()));
        }

        return Inertia::render('Workspace/Choose', [
            'company' => auth()->user()->company?->name,
        ]);
    }

    public function switch(Request $request, CurrentWorkspace $workspace): RedirectResponse
    {
        abort_unless($workspace->isAvailable(), 403);

        $validated = $request->validate([
            'workspace' => ['required', Rule::in([CurrentWorkspace::SHOP, CurrentWorkspace::LOGISTICS])],
        ]);

        session([CurrentWorkspace::SESSION_KEY => $validated['workspace']]);

        // Deliberately not redirect()->intended(): the page they were heading
        // for when we interrupted them belongs to whichever system they were
        // in before, so honouring it would answer "logistics" with the shop's
        // dashboard. Dropped rather than left to fire on some later redirect.
        $request->session()->forget('url.intended');

        // Straight to that system's front door: the two have entirely different
        // menus, so staying on the current page would strand them somewhere
        // the new sidebar cannot navigate back from.
        return redirect($workspace->landingRoute($validated['workspace']));
    }
}
