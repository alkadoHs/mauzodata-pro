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
import { Product, VendorProduct } from "@/lib/schemas";
import { numberFormat } from "@/lib/utils";
import { PageProps, User } from "@/types";
import { Head, router } from "@inertiajs/react";
import CreateVendorProduct from "./actions/CreateVendorProduct";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Index = ({
    auth,
    vendorProducts,
    users,
    products,
}: PageProps<{
    vendorProducts: VendorProduct[];
    users: User[];
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
            <Head title="Vendor products" />

            <section>
                <div className="flex justify-end py-3">
                    <CreateVendorProduct users={users} products={products} />
                </div>
                <div className="rounded-md border  dark:border-gray-800">
                    <Table>
                        <TableHeader>
                            <TableHead>VENDOR</TableHead>
                            <TableHead>PRODUCT</TableHead>
                            <TableHead>SELLING PRICE</TableHead>
                            <TableHead>STOCK</TableHead>
                            <TableHead>SOLD</TableHead>
                            <TableHead>BALANCE</TableHead>
                            <TableHead>STATUS</TableHead>
                            <TableHead>ACTION</TableHead>
                        </TableHeader>
                        <TableBody>
                            {vendorProducts?.map((vendorProduct, index) => (
                                <TableRow key={vendorProduct.id}>
                                    <TableCell>
                                        {vendorProduct?.user?.name}
                                    </TableCell>
                                    <TableCell>
                                        {vendorProduct?.product?.name}
                                    </TableCell>
                                    <TableCell>
                                        {numberFormat(
                                            vendorProduct?.sale_price
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            className="max-w-20"
                                            type="number"
                                            value={numberFormat(
                                                vendorProduct.stock
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            className="max-w-20"
                                            type="number"
                                            defaultValue={vendorProduct.sold}
                                            onBlur={(e) => {
                                                router.patch(
                                                    route(
                                                        "vendorproducts.update",
                                                        vendorProduct.id
                                                    ),
                                                    {
                                                        sold: parseFloat(
                                                            e.target.value
                                                        ),
                                                    },
                                                    {
                                                        onSuccess: () => {
                                                                // e.target.value =
                                                                //     vendorProduct.sold.toString();
                                                        },
                                                        onError: (errors) => {
                                                            toast.error(
                                                                errors.sold
                                                            );
                                                            e.target.value =
                                                                vendorProduct.sold.toString();
                                                        },
                                                        preserveState: false,
                                                        preserveScroll: true,
                                                    }
                                                );
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {numberFormat(
                                            vendorProduct?.stock -
                                                vendorProduct?.sold
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {vendorProduct?.status}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            onClick={() =>
                                                router.post(
                                                    route(
                                                        "vendorproducts.confirm",
                                                        {
                                                            vendorProduct:
                                                                vendorProduct.id,
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
                            {/* <TableCell>{numberFormat(totalSold)}</TableCell>
                          <TableCell>{numberFormat(totalSales)}</TableCell> */}
                        </TableFooter>
                    </Table>
                </div>
            </section>
        </Authenticated>
    );
};

export default Index;
