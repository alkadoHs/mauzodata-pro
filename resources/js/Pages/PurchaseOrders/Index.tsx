import Authenticated from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Head, Link, router } from "@inertiajs/react";
import { PaginatedPurchaseOrder, PurchaseOrder } from "@/lib/schemas";
import { Heading4 } from "@/components/Typography/Heading4";
import { Button } from "@/components/ui/button";
import { PlusCircle, ExternalLink, ArrowLeft, ArrowRight, ChevronFirstIcon, ChevronLastIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { numberFormat, dateFormat } from "@/lib/utils";

export default function PurchaseOrderIndex({ auth, purchaseOrders }: PageProps<{ purchaseOrders: PaginatedPurchaseOrder }>) {
    
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary">Pending</Badge>;
            case 'received':
                return <Badge variant="default" className="bg-green-600">Received</Badge>;
            case 'cancelled':
                return <Badge variant="destructive">Cancelled</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };
    
    return (
        <Authenticated user={auth.user}>
            <Head title="Purchase Orders" />

            <div className="flex justify-between items-center mb-4">
                <Heading4>Purchase Orders</Heading4>
                <Button size={"sm"} onClick={() => router.get(route('purchase-orders.create'))}>
                    <PlusCircle className="size-5 mr-2" />
                    New Purchase Order
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>PO ID</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {purchaseOrders.data.length > 0 ? (
                            purchaseOrders.data.map((po) => (
                                <TableRow key={po.id}>
                                    <TableCell>PO-{po.id}</TableCell>
                                    <TableCell>{po.supplier?.name}</TableCell>
                                    <TableCell>{getStatusBadge(po.status)}</TableCell>
                                    <TableCell>{po.items.length}</TableCell>
                                    <TableCell>{dateFormat(po.created_at)}</TableCell>
                                    <TableCell>
                                        <Link href={route('purchase-orders.show', po.id)}>
                                            <Button variant="outline" size="icon">
                                                <ExternalLink className="size-4" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No purchase orders found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
             <div className="flex items-center gap-3 justify-center my-3">
                <Link href={purchaseOrders.first_page_url} disabled={!purchaseOrders.first_page_url} preserveScroll>
                    <Button variant={"outline"} size={"sm"} disabled={!purchaseOrders.first_page_url}><ChevronFirstIcon className="size-5 text-muted-foreground mr-2" /></Button>
                </Link>
                <Link href={purchaseOrders.prev_page_url} disabled={!purchaseOrders.prev_page_url} preserveScroll>
                    <Button variant={"outline"} size={"sm"}><ArrowLeft className="size-5 text-muted-foreground mr-2" /> Prev</Button>
                </Link>
                <span>page - <b>{purchaseOrders.current_page}</b></span>
                <Link href={purchaseOrders.next_page_url} disabled={!purchaseOrders.next_page_url} preserveScroll>
                    <Button variant={"outline"} size={"sm"}>Next <ArrowRight className="size-5 text-muted-foreground mr-l" /></Button>
                </Link>
                 <Link href={purchaseOrders.last_page_url} disabled={!purchaseOrders.last_page_url} preserveScroll>
                    <Button variant={"outline"} size={"sm"} disabled={!purchaseOrders.last_page_url}><ChevronLastIcon className="size-5 text-muted-foreground mr-2" /></Button>
                </Link>
            </div>
        </Authenticated>
    );
}