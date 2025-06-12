import { Head, Link, router } from "@inertiajs/react";
import { PageProps } from "@/types";
import { PurchaseOrder } from "@/lib/schemas";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Heading4 } from "@/components/Typography/Heading4";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dateFormat, numberFormat } from "@/lib/utils";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { FormEventHandler } from "react";
import { toast } from "sonner";

export default function PurchaseOrderShow({ auth, purchaseOrder }: PageProps<{ purchaseOrder: PurchaseOrder }>) {
    
    const totalCost = purchaseOrder.items.reduce((acc, item) => acc + (item.quantity * item.cost), 0);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge variant="secondary">Pending</Badge>;
            case 'received': return <Badge className="bg-green-600">Received</Badge>;
            case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };
    
    const handleReceiveOrder: FormEventHandler = (e) => {
        e.preventDefault();
        if (confirm("Are you sure you want to mark this order as received? This will update your stock levels.")) {
            router.post(route('purchase-orders.receive', purchaseOrder.id), {}, {
                onSuccess: () => toast.success("Order marked as received and stock updated!"),
            });
        }
    };

    return (
        <Authenticated user={auth.user}>
            <Head title={`Purchase Order #${purchaseOrder.id}`} />

            <div className="flex justify-between items-center mb-4">
                <Heading4>Purchase Order Details</Heading4>
                <Link href={route('purchase-orders.index')}><Button variant="outline"><ArrowLeft className="size-4 mr-2" />Back to List</Button></Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>PO-{purchaseOrder.id}</CardTitle>
                            {getStatusBadge(purchaseOrder.status)}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Cost</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchaseOrder.items.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.product.name}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right">{numberFormat(item.cost)}</TableCell>
                                        <TableCell className="text-right">{numberFormat(item.quantity * item.cost)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                                    <TableCell className="text-right font-bold">{numberFormat(totalCost)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </CardContent>
                </Card>
                 <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Supplier Information</CardTitle></CardHeader>
                        <CardContent className="text-sm space-y-1">
                            <p><strong>Name:</strong> {purchaseOrder.supplier.name}</p>
                            <p><strong>Email:</strong> {purchaseOrder.supplier.email || 'N/A'}</p>
                            <p><strong>Phone:</strong> {purchaseOrder.supplier.phone || 'N/A'}</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Order Information</CardTitle></CardHeader>
                        <CardContent className="text-sm space-y-1">
                            <p><strong>Created By:</strong> {purchaseOrder.user.name}</p>
                            <p><strong>Date:</strong> {dateFormat(purchaseOrder.created_at)}</p>
                            {purchaseOrder.notes && <p><strong>Notes:</strong> {purchaseOrder.notes}</p>}
                        </CardContent>
                    </Card>

                    {purchaseOrder.status === 'pending' && (
                        <form onSubmit={handleReceiveOrder}>
                            <Button className="w-full bg-green-600 hover:bg-green-700">
                                <CheckCircle className="size-5 mr-2" />
                                Mark as Received & Update Stock
                            </Button>
                        </form>
                    )}
                 </div>
            </div>
        </Authenticated>
    );
}