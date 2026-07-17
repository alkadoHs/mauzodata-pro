import Authenticated from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import NewStockForm from "./partials/NewStockForm";
import { NewStock, Product } from "@/lib/schemas";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { numberFormat } from "@/lib/utils";
import dayjs from "dayjs";
import { PackagePlus } from "lucide-react";
import { useFlashToast } from "@/hooks/useFlashToast";

const Index = ({
    auth,
    newStocks,
    total,
    products,
}: PageProps<{ newStocks: NewStock[]; total: number; products: Product[] }>) => {
    // Was fired straight from the render body, so it re-toasted on every render.
    useFlashToast();

    return (
        <Authenticated user={auth.user}>
            <Head title="New stock" />

            <section className="space-y-4">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            New stock
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Stock received into this branch today ·{" "}
                            {dayjs().format("DD MMM YYYY")}
                        </p>
                    </div>
                    <div className="rounded-xl border border-border bg-card px-4 py-2 text-right">
                        <span className="text-xs text-muted-foreground">
                            Units added today
                        </span>
                        <p className="text-xl font-semibold tabular-nums">
                            {numberFormat(total)}
                        </p>
                    </div>
                </header>

                <NewStockForm products={products} />

                <div className="rounded-xl border border-border bg-card">
                    <div className="border-b border-border p-4">
                        <h2 className="font-medium">
                            Received today{" "}
                            <span className="text-sm font-normal text-muted-foreground">
                                ({newStocks.length})
                            </span>
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Added</TableHead>
                                    <TableHead className="text-right">
                                        Stock before
                                    </TableHead>
                                    <TableHead>Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {newStocks.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="h-28 text-center text-muted-foreground"
                                        >
                                            <span className="flex flex-col items-center gap-2">
                                                <PackagePlus className="size-6 opacity-50" />
                                                No stock received today.
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    newStocks.map((stock) => (
                                        <TableRow key={stock.id}>
                                            <TableCell className="font-medium">
                                                {stock.product?.name ?? "—"}
                                                {stock.product?.unit && (
                                                    <span className="ml-1 text-xs text-muted-foreground">
                                                        / {stock.product.unit}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-medium tabular-nums">
                                                +{numberFormat(stock.new_stock)}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums text-muted-foreground">
                                                {numberFormat(stock.stock)}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-muted-foreground">
                                                {dayjs(stock.created_at).format("HH:mm")}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </section>
        </Authenticated>
    );
};

export default Index;
