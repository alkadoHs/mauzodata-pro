import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Order } from "@/lib/schemas";
import { numberFormat } from "@/lib/utils";
import { router } from "@inertiajs/react";
import { CircleXIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function OrderDetail({ order }: { order: Order }) {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                    View(<span className="text-primary">{order.order_items.length}</span>)
                </Button>
            </PopoverTrigger>
            <PopoverContent className="min-w-md">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Sale Items</h4>
                        <p className="text-sm text-muted-foreground">
                            Products associated with this sale.
                        </p>
                    </div>
                    <Table className="">
                        <TableHeader>
                            <TableRow>
                                <TableHead>PRODUCT</TableHead>
                                <TableHead>QTY</TableHead>
                                <TableHead>PRICE</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {order?.order_items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item?.product?.name}</TableCell>
                                    <TableCell>
                                        {numberFormat(item.quantity)}
                                    </TableCell>
                                    <TableCell>
                                        {numberFormat(item.price)}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant={"secondary"}
                                            size={"icon"}
                                            onClick={() =>
                                                router.delete(
                                                    route(
                                                        "orders.items.destroy",
                                                        item.id
                                                    ),
                                                    {
                                                        preserveScroll: true,
                                                        preserveState: true,
                                                        onSuccess: () =>
                                                            toast.success(
                                                                "Delete successfully."
                                                            ),
                                                        onError: () =>
                                                            toast.error(
                                                                "Unexpected error occured while deleting this item, please try again. If error persist, contact mauzodata team."
                                                            ),
                                                    }
                                                )
                                            }
                                        >
                                            <CircleXIcon className="size-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </PopoverContent>
        </Popover>
    );
}
