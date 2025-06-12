import { Heading4 } from "@/components/Typography/Heading4";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { LedgerEntry, Product } from "@/lib/schemas";
import { dateFormat, dateTimeFormat, numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";

export default function ProductLedger({ auth, product, ledger, openingStock }: PageProps<{ product: Product, ledger: LedgerEntry[], openingStock: number }>) {

    let currentStock = openingStock;

    return (
        <Authenticated user={auth.user}>
            <Head title={`${product.name} - Stock Ledger`} />
            
            <div className="flex justify-between items-center mb-4">
                 <Heading4>{product.name} - Stock Ledger</Heading4>
                 <Link href={route('reports.inventory')}><Button variant="outline"><ArrowLeft className="size-4 mr-2" />Back to Inventory</Button></Link>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Transaction Type</TableHead>
                            <TableHead className="text-right">Stock In</TableHead>
                            <TableHead className="text-right">Stock Out</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow className="font-semibold bg-muted/50">
                            <TableCell colSpan={4}>Opening Stock</TableCell>
                            <TableCell className="text-right">{numberFormat(openingStock)}</TableCell>
                        </TableRow>
                        {ledger.map((entry, index) => {
                            const stockIn = entry.stock_in ?? 0;
                            const stockOut = entry.stock_out ?? 0;
                            currentStock = Number(currentStock) + Number(stockIn) - Number(stockOut);
                            
                            return (
                                <TableRow key={index}>
                                    <TableCell>{dateTimeFormat(entry.created_at)}</TableCell>
                                    <TableCell>{entry.type}</TableCell>
                                    <TableCell className="text-right text-green-500">{stockIn > 0 ? numberFormat(stockIn) : '-'}</TableCell>
                                    <TableCell className="text-right text-red-500">{stockOut > 0 ? numberFormat(stockOut) : '-'}</TableCell>
                                    <TableCell className="text-right font-medium">{numberFormat(currentStock)}</TableCell>
                                </TableRow>
                            );
                        })}
                         <TableRow className="font-bold text-lg bg-muted/50">
                            <TableCell colSpan={4}>Closing Stock (Current)</TableCell>
                            <TableCell className="text-right">{numberFormat(product.stock)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </Authenticated>
    );
}