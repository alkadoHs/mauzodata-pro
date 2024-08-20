import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Branch, Product, VendorProduct } from "@/lib/schemas";
import { numberFormat } from "@/lib/utils";
import { PageProps, User } from "@/types";
import { Head, router } from "@inertiajs/react";
import React, { ChangeEvent } from "react";
import CreatestockTransfer from "./actions/CreateStockTranfer";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/ui/button";
import { error } from "console";
import CreateStockTransfer from "./actions/CreateStockTranfer";

const Index = ({
    auth,
    stockTransfers,
    branches,
    products,
}: PageProps<{
    stockTransfers: VendorProduct[];
    branches: Branch[];
    products: Product[];
}>) => {
    if (auth.success) {
        toast.success(auth.success);
    } else if (auth.error) {
        toast.error(auth.error);
    } else if (auth.info) {
        toast.info(auth.info);
    }

    return (
        <Authenticated user={auth.user}>
            <Head title="Stock transfers" />

            <section>
                <div className="py-3">
                    <CreateStockTransfer
                        branches={branches}
                        products={products}
                    />
                </div>
                <div className="rounded-md border  dark:border-gray-800">
                    <Table>
                        <TableHeader>
                            <TableHead>BRANCH</TableHead>
                            <TableHead>PRODUCT</TableHead>
                            <TableHead>STOCK</TableHead>
                            <TableHead>STATUS</TableHead>
                            <TableHead>ACTION</TableHead>
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
                                    <TableCell>
                                        <Button
                                            onClick={() =>
                                                router.post(
                                                    route(
                                                        "stocktransfer.confirm",
                                                        {
                                                            product:
                                                                stockTransfer.id,
                                                        }
                                                    )
                                                )
                                            }
                                            size={"sm"}
                                        >
                                            Confirm
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableCell>
                                <b>TOTAL</b>
                            </TableCell>
                            {/* <TableCell>{numberFormat(totalstock)}</TableCell>
                          <TableCell>{numberFormat(totalSales)}</TableCell> */}
                        </TableFooter>
                    </Table>
                </div>
            </section>
        </Authenticated>
    );
};

export default Index;
