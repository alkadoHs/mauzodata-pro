import { cn, numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { router } from "@inertiajs/react";
import { Tag, X } from "lucide-react";
import { Column, ReportView } from "./partials/ReportView";

type Row = {
    id: number;
    date: string;
    branch: string | null;
    user: string | null;
    category: string;
    item: string;
    cost: number;
};

type CategoryRow = {
    /** A numeric category id, or the "none" sentinel for uncategorised spend. */
    id: number | string;
    name: string;
    cost: number;
    count: number;
    percent: number;
};

type Filters = {
    from_date?: string;
    to_date?: string;
    user_id?: number | string;
    category_id?: string | null;
};

const columns: Column<Row>[] = [
    { key: "date", label: "Date", className: "whitespace-nowrap" },
    { key: "branch", label: "Branch" },
    { key: "user", label: "Spent by" },
    { key: "category", label: "Category" },
    { key: "item", label: "Item" },
    { key: "cost", label: "Cost", numeric: true },
];

// Cycled per category, in the same 5-hue palette the rest of the app's
// charts already use (Dashboard, Top Selling Products) — keeps this report
// visually part of the same family instead of inventing its own colours.
const barColor = (index: number) => `hsl(var(--chart-${(index % 5) + 1}))`;

export default function ExpensesReport({
    rows,
    totals,
    categories,
    filters,
    sellers,
    branchLabel,
}: PageProps<{
    rows: Row[];
    totals: { cost: number; count: number };
    categories: CategoryRow[];
    filters: Filters;
    sellers: { id: number; name: string }[];
    branchLabel: string;
}>) {
    // The breakdown is driven by the committed (URL-reflected) filters, not
    // any in-progress edit sitting in ReportView's own date/seller form — so
    // clicking a bar acts on what's actually on screen right now.
    const goTo = (categoryId: string | number | null) => {
        router.get(
            route("reports.expensesReport"),
            {
                from_date: filters.from_date || undefined,
                to_date: filters.to_date || undefined,
                user_id: filters.user_id || undefined,
                category_id: categoryId === null ? undefined : String(categoryId),
            },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const activeId = filters.category_id ?? null;
    const activeCategory = categories.find((c) => String(c.id) === String(activeId));

    return (
        <ReportView
            title="Expenses Report"
            description="Every expense line, with who spent it"
            rows={rows}
            columns={columns}
            totalsRow={{ cost: numberFormat(totals.cost) }}
            filters={filters}
            sellers={sellers}
            branchLabel={branchLabel}
            sellerLabel="Spent by"
            indexRoute="reports.expensesReport"
            excelRoute="reports.expensesReport.excel"
            pdfRoute="reports.expensesReport.pdf"
            extraParams={{ category_id: filters.category_id ?? undefined }}
            beforeTable={
                <CategoryBreakdown
                    categories={categories}
                    total={totals.cost}
                    activeId={activeId}
                    activeCategory={activeCategory}
                    onSelect={goTo}
                />
            }
        />
    );
}

/**
 * How this period's spending splits by category — the highest-spend category
 * first, each bar clickable to narrow the itemized table below to just that
 * category. Always shows every category regardless of which one (if any) is
 * currently selected, so the full picture stays visible while drilling in.
 */
function CategoryBreakdown({
    categories,
    total,
    activeId,
    activeCategory,
    onSelect,
}: {
    categories: CategoryRow[];
    total: number;
    activeId: string | number | null;
    activeCategory?: CategoryRow;
    onSelect: (id: string | number | null) => void;
}) {
    if (categories.length === 0) {
        return null;
    }

    const top = categories[0];

    return (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h2 className="text-sm font-medium">By category</h2>
                    <p className="text-xs text-muted-foreground">
                        What this money went on for this period. Click one to
                        see just its items below.
                    </p>
                </div>

                {activeCategory && (
                    <button
                        type="button"
                        onClick={() => onSelect(null)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/15"
                    >
                        <Tag className="size-3" />
                        {activeCategory.name}
                        <X className="size-3" />
                    </button>
                )}
            </div>

            {/* At-a-glance highlights, same card language as the rest of the
                reports (SalesReportView's summary cards). */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat label="Total spent" value={numberFormat(total)} />
                <Stat
                    label="Categories used"
                    value={String(categories.length)}
                />
                <Stat
                    label="Biggest spend"
                    value={top.name}
                    hint={numberFormat(top.cost)}
                    className="col-span-2 sm:col-span-1"
                />
            </div>

            <ul className="space-y-1.5">
                {categories.map((c, i) => {
                    const active = String(c.id) === String(activeId);

                    return (
                        <li key={c.id}>
                            <button
                                type="button"
                                onClick={() => onSelect(active ? null : c.id)}
                                aria-pressed={active}
                                title={`See only ${c.name} expenses`}
                                className={cn(
                                    "group flex w-full items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors hover:border-border hover:bg-muted/50",
                                    active && "border-primary/40 bg-primary/5"
                                )}
                            >
                                <span
                                    className={cn(
                                        "w-28 shrink-0 truncate text-sm font-medium sm:w-40",
                                        c.name === "Uncategorised" &&
                                            "italic text-muted-foreground"
                                    )}
                                >
                                    {c.name}
                                </span>

                                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                                    <span
                                        className="block h-full rounded-full transition-[width]"
                                        style={{
                                            width: `${Math.max(c.percent, 2)}%`,
                                            backgroundColor: barColor(i),
                                        }}
                                    />
                                </span>

                                <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums">
                                    {numberFormat(c.cost)}
                                </span>
                                <span className="w-20 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                                    {c.percent.toFixed(1)}% · {c.count}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function Stat({
    label,
    value,
    hint,
    className,
}: {
    label: string;
    value: string;
    hint?: string;
    className?: string;
}) {
    return (
        <div className={cn("rounded-lg border bg-background p-3", className)}>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </div>
            <div className="truncate text-lg font-semibold tabular-nums">
                {value}
            </div>
            {hint && (
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {hint}
                </div>
            )}
        </div>
    );
}
