import React from "react";
import { ProductTransfer } from "./Index";
import { PageProps } from "@/types";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { dateFormatFilter, numberFormat } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const Show = ({
    auth,
    productTransfer,
}: PageProps<{ productTransfer: ProductTransfer }>) => {
    console.log("productTransfer", productTransfer);

    return (
        <Authenticated user={auth.user}>
            <Head title={`Product Transfer #${productTransfer.id}`} />

            <section className="max-w-4xl mx-auto w-full bg-gray-600/10 p-4 print:p-0 rounded-lg">
                <div className="text-center">
                    <h1 className="text-2xl font-medium">MASINDE STORE</h1>
                    <p className="text-lg uppercase">
                        PRODUCT TRANSFER TO: {productTransfer.branch?.name}
                    </p>
                    <p>Date: {dateFormatFilter(productTransfer.created_at)}</p>
                </div>

                <hr />

                <div>
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="p-3 text-left">Product</th>
                                <th className="p-3 text-left">Stock</th>
                                <th className="p-3 text-left">Selling price</th>
                            </tr>
                        </thead>

                        <tbody>
                            {productTransfer.product_transfer_items.map(
                                (item) => (
                                    <tr key={item.id}>
                                        <td className="p-3">
                                            {item.product?.name}
                                        </td>
                                        <td className="p-3">{item.stock}</td>
                                        <td className="p-3">
                                            {numberFormat(
                                                item.product?.sale_price
                                            )}
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                <hr />

                <br />

                <div className="flex justify-center">
                    <Button className="print:hidden" onClick={() => window.print()}>
                        <Printer className="size-5" /> Print
                    </Button>
                </div>
            </section>
        </Authenticated>
    );
};

export default Show;
