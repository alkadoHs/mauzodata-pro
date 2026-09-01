import { cn, numberFormat } from "@/lib/utils";
import { Link } from "@inertiajs/react";

export type TrendMonth = {
    key: string;
    label: string;
    from: string;
    to: string;
    trips: number;
    freight: number;
    net_profit: number;
};

/**
 * Net profit month by month.
 *
 * Bars are drawn from a zero line rather than from the floor of the card, so
 * a losing month hangs below it and is unmistakable. Scaled to the largest
 * magnitude either side, which keeps a single bad month from flattening every
 * good one into a stub.
 */
export function Trend({ months }: { months: TrendMonth[] }) {
    const peak = months.reduce((m, x) => Math.max(m, Math.abs(x.net_profit)), 0);
    const anyLoss = months.some((m) => m.net_profit < 0);

    return (
        <div className="rounded-xl border bg-card">
            <div className="border-b p-3">
                <h2 className="font-medium">Net profit by month</h2>
                <p className="text-xs text-muted-foreground">
                    After trip costs and running costs. Click a month to open it.
                </p>
            </div>

            <div className="flex items-stretch gap-2 p-3">
                {months.map((month) => {
                    const share = peak > 0 ? (Math.abs(month.net_profit) / peak) * 100 : 0;
                    const loss = month.net_profit < 0;

                    return (
                        <Link
                            key={month.key}
                            href={route("logistics.profit", {
                                from_date: month.from,
                                to_date: month.to,
                            })}
                            className="group flex flex-1 flex-col items-center gap-1.5 rounded-md p-1 transition-colors hover:bg-accent"
                        >
                            <span
                                className={cn(
                                    "text-[11px] tabular-nums",
                                    loss ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                                )}
                            >
                                {month.net_profit === 0 ? "—" : compact(month.net_profit)}
                            </span>

                            {/* Above the line */}
                            <div className="flex h-16 w-full items-end">
                                {!loss && (
                                    <div
                                        className="w-full rounded-t bg-emerald-500/70 transition-colors group-hover:bg-emerald-500"
                                        style={{ height: `${Math.max(share, month.net_profit > 0 ? 4 : 0)}%` }}
                                    />
                                )}
                            </div>

                            <div className="h-px w-full bg-border" />

                            {/* Below it, only drawn when some month actually lost money. */}
                            {anyLoss && (
                                <div className="flex h-8 w-full items-start">
                                    {loss && (
                                        <div
                                            className="w-full rounded-b bg-red-500/70 transition-colors group-hover:bg-red-500"
                                            style={{ height: `${Math.max(share / 2, 4)}%` }}
                                        />
                                    )}
                                </div>
                            )}

                            <span className="text-xs text-muted-foreground">{month.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

/** 4,550,000 -> 4.55M. Six of these have to fit across a card. */
function compact(value: number): string {
    const abs = Math.abs(value);
    const sign = value < 0 ? "−" : "";

    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}k`;
    return `${sign}${numberFormat(abs)}`;
}
