import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { PageProps } from "@/types";
import { Head, router } from "@inertiajs/react";
import { VendorProduct } from "@/lib/schemas";
import { numberFormat } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function StockTransfers({
    auth,
    stockTransfers,
}: PageProps<{ stockTransfers: VendorProduct[] }>) {
    return (
        <Authenticated user={auth.user}>
            <Head title="Users" />

            <section className="p-4 pt-0">
                <header>
                    <h2 className="text-xl my-3">Stock Transfered</h2>

                    <div className="flex justify-between items-center mb-3">
                        <div>
                            Confirmed stock transfers
                        </div>
                        <div className="">
                            <Input
                                type="date"
                                name="date"
                                onChange={(e) => {
                                    router.get(
                                        route("reports.stocktransfers"),
                                        { date: e.target.value },
                                        { preserveState: true }
                                    );
                                }}
                            />
                        </div>
                    </div>
                </header>
                <div className="rounded-md border bg-slate-50 dark:bg-slate-800/50 dark:border-gray-800">
                    <Table>
                        <TableHeader>
                            <TableHead>BRANCH</TableHead>
                            <TableHead>PRODUCT</TableHead>
                            <TableHead>STOCK</TableHead>
                            <TableHead>STATUS</TableHead>
                        </TableHeader>
                        <TableBody>
                            {stockTransfers?.map((stockTransfer, index) => (
                                <TableRow key={stockTransfer.id}>
                                    <TableCell>
                                        {stockTransfer?.branch?.name}
                                    </TableCell>
                                    <TableCell>
                                        {stockTransfer?.product?.name}
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            className="max-w-20"
                                            type="number"
                                            value={numberFormat(
                                                stockTransfer.stock
                                            )}
                                            onBlur={(e) => {
                                                router.patch(
                                                    route(
                                                        "stocktransfer.update",
                                                        stockTransfer.id
                                                    ),
                                                    {
                                                        stock: parseFloat(
                                                            e.target.value
                                                        ),
                                                    },
                                                    {
                                                        onSuccess: () => {
                                                            // e.target.value =
                                                            //     stockTransfer.stock.toString();
                                                        },
                                                        onError: (errors) => {
                                                            toast.error(
                                                                errors.stock
                                                            );
                                                            e.target.value =
                                                                stockTransfer.stock.toString();
                                                        },
                                                        preserveState: false,
                                                        preserveScroll: true,
                                                    }
                                                );
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {stockTransfer?.status}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="flex items-center gap-3 justify-center my-3"></div>
                </div>
            </section>
        </Authenticated>
    );
}
