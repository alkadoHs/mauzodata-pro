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
import { DataTable } from "@/components/DataTable";
import { productTransferColumns } from "../ProductTransfers/transfer-columns";
import { ProductTransfer } from "../ProductTransfers/Index";

export default function StockTransfers({
    auth,
    stockTransfers,
}: PageProps<{ stockTransfers: ProductTransfer[] }>) {
    return (
        <Authenticated user={auth.user}>
            <Head title="Users" />

            <section className="pt-0">
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
                    <DataTable columns={productTransferColumns} data={stockTransfers} />

                    <div className="flex items-center gap-3 justify-center my-3"></div>
                </div>
            </section>
        </Authenticated>
    );
}
