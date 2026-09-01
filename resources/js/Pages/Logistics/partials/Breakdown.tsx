import { cn, numberFormat } from "@/lib/utils";

/**
 * Where a pile of money went, largest first.
 *
 * Bars are proportional to the biggest row rather than to the total, so the
 * smaller categories stay visible instead of collapsing into slivers.
 */
export function Breakdown({
    title,
    subtitle,
    rows,
    total,
    tone = "out",
    empty,
}: {
    title: string;
    subtitle?: string;
    rows: { category: string; label: string; total: number }[];
    total: number;
    tone?: "in" | "out";
    empty: string;
}) {
    const biggest = rows.reduce((max, r) => Math.max(max, r.total), 0);

    return (
        <div className="rounded-xl border bg-card">
            <div className="flex items-start justify-between gap-3 border-b p-3">
                <div>
                    <h2 className="font-medium">{title}</h2>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    )}
                </div>
                <div className="text-lg font-semibold tabular-nums">
                    {numberFormat(total)}
                </div>
            </div>

            {rows.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">{empty}</p>
            ) : (
                <ul className="space-y-2.5 p-3">
                    {rows.map((row) => {
                        const share = total > 0 ? (row.total / total) * 100 : 0;
                        const width = biggest > 0 ? (row.total / biggest) * 100 : 0;

                        return (
                            <li key={row.category}>
                                <div className="flex items-baseline justify-between gap-2 text-sm">
                                    <span className="truncate">{row.label}</span>
                                    <span className="shrink-0 tabular-nums">
                                        {numberFormat(row.total)}
                                        <span className="ml-1.5 text-xs text-muted-foreground">
                                            {share.toFixed(0)}%
                                        </span>
                                    </span>
                                </div>
                                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className={cn(
                                            "h-full rounded-full",
                                            tone === "out" ? "bg-red-500/70" : "bg-emerald-500/70"
                                        )}
                                        style={{ width: `${width}%` }}
                                    />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
