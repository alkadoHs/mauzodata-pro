import { Heading4 } from "@/components/Typography/Heading4";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { cn, numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head, router, useForm } from "@inertiajs/react";
import {
    AlertTriangle,
    CheckCircle2,
    DatabaseZap,
    Loader2,
    Trash2,
    UploadCloud,
    XCircle,
} from "lucide-react";
import { FormEventHandler } from "react";

type TableResult = { imported: number; skipped: number; reused: number };

type Migration = {
    id: number;
    branch_name: string;
    original_name: string;
    size: number;
    status: "importing" | "imported" | "failed";
    source: {
        database?: string | null;
        server?: string | null;
        tables?: Record<string, number>;
        branches?: string[];
    } | null;
    summary: Record<string, TableResult> | null;
    error: string | null;
    duration_ms: number | null;
    created_at: string;
    branch: { id: number; name: string } | null;
    user: { id: number; name: string } | null;
};

type Props = {
    migrations: Migration[];
    limits: { upload: string; post: string };
};

const megabytes = (bytes: number) =>
    bytes >= 1048576
        ? `${(bytes / 1048576).toFixed(1)} MB`
        : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const seconds = (ms: number | null) =>
    ms === null ? "—" : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;

const label = (table: string) =>
    table.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function DataMigrations({
    auth,
    migrations,
    limits,
}: PageProps<Props>) {
    const { data, setData, post, processing, errors, reset, progress } =
        useForm<{ branch_name: string; dump: File | null }>({
            branch_name: "",
            dump: null,
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("data-migrations.store"), {
            forceFormData: true,
            onSuccess: () => reset(),
        });
    };

    const latest = migrations[0];

    return (
        <Authenticated user={auth.user}>
            <Head title="Data migration" />

            <section className="flex flex-col gap-6">
                <div>
                    <Heading4>Data migration</Heading4>
                    <p className="text-sm text-muted-foreground">
                        Bring the old system's records into this one. Each
                        backup file becomes one new branch.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="flex flex-col gap-4 rounded-lg border bg-card p-4"
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-1.5">
                            <span className="text-sm font-medium">
                                New branch name
                            </span>
                            <Input
                                value={data.branch_name}
                                onChange={(e) =>
                                    setData("branch_name", e.target.value)
                                }
                                placeholder="e.g. Masinde Store - Mbalizi"
                                disabled={processing}
                            />
                            <span className="text-xs text-muted-foreground">
                                A new branch is created with this name and all
                                the records go into it.
                            </span>
                            {errors.branch_name && (
                                <span className="text-xs text-red-600">
                                    {errors.branch_name}
                                </span>
                            )}
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <span className="text-sm font-medium">
                                Backup file (.sql)
                            </span>
                            <Input
                                type="file"
                                accept=".sql"
                                onChange={(e) =>
                                    setData(
                                        "dump",
                                        e.target.files?.[0] ?? null
                                    )
                                }
                                disabled={processing}
                                className="file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-sm"
                            />
                            <span className="text-xs text-muted-foreground">
                                The database backup from the old system. Files
                                up to {limits.upload} are accepted.
                            </span>
                            {errors.dump && (
                                <span className="text-xs text-red-600">
                                    {errors.dump}
                                </span>
                            )}
                        </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            type="submit"
                            disabled={
                                processing || !data.branch_name || !data.dump
                            }
                            className="gap-2"
                        >
                            {processing ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <UploadCloud className="size-4" />
                            )}
                            {processing ? "Importing…" : "Start migration"}
                        </Button>

                        {progress && (
                            <span className="text-xs text-muted-foreground">
                                Uploading {progress.percentage}%
                            </span>
                        )}
                        {processing && !progress && (
                            <span className="text-xs text-muted-foreground">
                                Reading the file and writing the records — this
                                can take a minute on a large backup. Do not
                                close this page.
                            </span>
                        )}
                    </div>

                    <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                        <AlertTriangle className="size-4 shrink-0" />
                        <div className="space-y-1">
                            <p>
                                Everything in the file lands in the one new
                                branch, including data the old system kept under
                                several branches. Sales, credit sales and stock
                                keep their original dates.
                            </p>
                            <p>
                                Staff accounts in the file are recreated so old
                                sales still show who sold them; they keep their
                                old passwords. If nothing can be written, the
                                whole import is cancelled and no branch is
                                created.
                            </p>
                        </div>
                    </div>
                </form>

                {latest?.status === "imported" && latest.summary && (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-5 text-emerald-600" />
                            <Heading4>
                                Last migration — {latest.branch?.name ?? latest.branch_name}
                            </Heading4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {latest.original_name} ({megabytes(latest.size)})
                            {latest.source?.database
                                ? ` from "${latest.source.database}"`
                                : ""}{" "}
                            · finished in {seconds(latest.duration_ms)}
                            {latest.source?.branches?.length
                                ? ` · merged ${latest.source.branches.length} old branch(es): ${latest.source.branches.join(", ")}`
                                : ""}
                        </p>

                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Records</TableHead>
                                        <TableHead className="text-right">
                                            In the file
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Brought in
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Already here
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Left out
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(latest.summary).map(
                                        ([table, r]) => (
                                            <TableRow key={table}>
                                                <TableCell>
                                                    {label(table)}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums text-muted-foreground">
                                                    {numberFormat(
                                                        latest.source
                                                            ?.tables?.[table] ??
                                                            0
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-medium tabular-nums">
                                                    {numberFormat(r.imported)}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums text-muted-foreground">
                                                    {r.reused
                                                        ? numberFormat(r.reused)
                                                        : "—"}
                                                </TableCell>
                                                <TableCell
                                                    className={cn(
                                                        "text-right tabular-nums",
                                                        r.skipped > 0
                                                            ? "font-medium text-amber-600"
                                                            : "text-muted-foreground"
                                                    )}
                                                >
                                                    {r.skipped
                                                        ? numberFormat(
                                                              r.skipped
                                                          )
                                                        : "—"}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <Heading4>History</Heading4>

                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>When</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>File</TableHead>
                                    <TableHead>By</TableHead>
                                    <TableHead className="text-right">
                                        Records
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Took
                                    </TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {migrations.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="py-10 text-center text-muted-foreground"
                                        >
                                            <DatabaseZap className="mx-auto mb-2 size-6 opacity-50" />
                                            No migrations yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {migrations.map((m) => {
                                    const rows = Object.values(
                                        m.summary ?? {}
                                    ).reduce((a, r) => a + r.imported, 0);

                                    return (
                                        <TableRow key={m.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {new Date(
                                                    m.created_at
                                                ).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {m.branch?.name ??
                                                    m.branch_name}
                                            </TableCell>
                                            <TableCell className="max-w-[220px] truncate">
                                                {m.original_name}{" "}
                                                <span className="text-muted-foreground">
                                                    ({megabytes(m.size)})
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {m.user?.name ?? "—"}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {rows ? numberFormat(rows) : "—"}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {seconds(m.duration_ms)}
                                            </TableCell>
                                            <TableCell>
                                                <Status migration={m} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Remove from history (imported records are kept)"
                                                    onClick={() =>
                                                        router.delete(
                                                            route(
                                                                "data-migrations.destroy",
                                                                m.id
                                                            ),
                                                            {
                                                                preserveScroll:
                                                                    true,
                                                            }
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="size-4 text-muted-foreground" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </section>
        </Authenticated>
    );
}

function Status({ migration }: { migration: Migration }) {
    if (migration.status === "imported") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                <CheckCircle2 className="size-3" /> Done
            </span>
        );
    }

    if (migration.status === "failed") {
        return (
            <span
                title={migration.error ?? undefined}
                className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/15 dark:text-red-400"
            >
                <XCircle className="size-3" /> Failed
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
            <Loader2 className="size-3 animate-spin" /> Running
        </span>
    );
}
