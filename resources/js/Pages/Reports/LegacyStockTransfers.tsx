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
import { VendorProduct } from "@/lib/schemas";
import { numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head, router } from "@inertiajs/react";
import { toast } from "sonner";

const LegacyStockTransfers = ({
    stockTransfers,
    auth,
}: PageProps<{ stockTransfers: VendorProduct[] }>) => {
    return (
        <Authenticated user={auth.user}>
            <Head title="Legacy Stock Transfers" />

            <section className="pt-0">
                <header>
                    <h2 className="text-xl my-3">Stock Transfered</h2>

                    <div className="flex justify-between items-center mb-3">
                        <div>Legacy stock transfers</div>
                        <div className="">
                            <Input
                                type="date"
                                name="date"
                                onChange={(e) => {
                                    router.get(
                                        route("reports.legacyStockTransfers"),
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
                                    <TableCell className="text-blue-500">
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
};

export default LegacyStockTransfers;
