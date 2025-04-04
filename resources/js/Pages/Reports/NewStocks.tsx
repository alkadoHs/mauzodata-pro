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
import { NewStock } from "@/lib/schemas";
import { dateFormat, numberFormat } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function NewStocks({
    auth,
    newStocks,
}: PageProps<{ newStocks: NewStock[] }>) {
    return (
        <Authenticated user={auth.user}>
            <Head title="Users" />

            <section className="pt-0">
                <header>
                    <h2 className="text-xl my-3">New stocks records</h2>

                    <div className="flex justify-between items-center mb-3">
                        <div>.........</div>
                        <div className="">
                            <Input
                                type="date"
                                name="date"
                                onChange={(e) => {
                                    router.get(
                                        route("reports.newstocks"),
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
                            <TableHead>S/N</TableHead>
                            <TableHead>PRODUCT</TableHead>
                            <TableHead>STOCK</TableHead>
                            <TableHead></TableHead>
                        </TableHeader>
                        <TableBody>
                            {newStocks?.map((newStock, index) => (
                                <TableRow key={newStock.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        {newStock?.product?.name}
                                    </TableCell>
                                    <TableCell>
                                        {numberFormat(newStock.new_stock)}
                                    </TableCell>
                                    <TableCell>{dateFormat(newStock.created_at)}</TableCell>
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
