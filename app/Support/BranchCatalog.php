<?php

namespace App\Support;

use App\Models\Product;
use App\Models\Scopes\BranchScope;

/**
 * Finds the row that stands for a product inside another branch.
 *
 * Products are per-branch rows with no shared code, so "the same product" in
 * two branches is two unrelated rows joined only by their name. Every transfer
 * has to answer "which row over there is this?", and answering it by hand is
 * what produces duplicate products and stock landing on the wrong one.
 *
 * Matching here is deterministic and repeatable:
 *   1. same name and same unit — the confident match;
 *   2. same name, different unit — still that product; a second row would be
 *      the duplicate we're avoiding. Oldest row wins so the answer never
 *      depends on ordering;
 *   3. nothing — create it once, copied from the source.
 *
 * Names are compared with case, surrounding space and repeated space
 * normalised away, so "Azam  Flour 2kg" and "azam flour 2kg" are one product.
 */
class BranchCatalog
{
    /** branch id => products in it, loaded once per request. */
    private array $catalogue = [];

    /**
     * The existing row in $branchId standing for $source, or null.
     */
    public function match(Product $source, int $branchId): ?Product
    {
        $name = $this->normalise($source->name);

        $sameName = array_values(array_filter(
            $this->catalogue($branchId),
            fn (Product $p) => $this->normalise($p->name) === $name
        ));

        if ($sameName === []) {
            return null;
        }

        $unit = $this->normalise($source->unit);

        foreach ($sameName as $candidate) {
            if ($this->normalise($candidate->unit) === $unit) {
                return $candidate;
            }
        }

        usort($sameName, fn (Product $a, Product $b) => $a->id <=> $b->id);

        return $sameName[0];
    }

    /**
     * The row in $branchId standing for $source, creating it if the branch
     * doesn't stock it yet. Never creates a second copy of something already
     * there, and never returns a row from the wrong branch.
     */
    public function resolve(Product $source, int $branchId): Product
    {
        if ($existing = $this->match($source, $branchId)) {
            return $existing;
        }

        // ProductObserver stamps branch_id with whichever branch the user is
        // *working in* — the sending branch here, which is precisely the wrong
        // one. Creating without events keeps the row where it belongs.
        $product = Product::withoutEvents(fn () => Product::create([
            'branch_id' => $branchId,
            'name' => $source->name,
            'unit' => $source->unit,
            'buy_price' => $source->buy_price,
            'sale_price' => $source->sale_price,
            'stock' => 0,
            'stock_alert' => $source->stock_alert,
            'whole_sale' => $source->whole_sale,
            'whole_price' => $source->whole_price,
            'expire_date' => $source->expire_date,
        ]));

        // So a second line for the same product in one transfer reuses it
        // rather than creating another.
        $this->catalogue[$branchId][] = $product;

        return $product;
    }

    /** @return array<int,Product> */
    private function catalogue(int $branchId): array
    {
        return $this->catalogue[$branchId] ??= Product::query()
            ->withoutGlobalScope(BranchScope::class)
            ->where('branch_id', $branchId)
            ->get()
            ->all();
    }

    private function normalise(?string $value): string
    {
        return preg_replace('/\s+/', ' ', trim(mb_strtolower((string) $value)));
    }
}
