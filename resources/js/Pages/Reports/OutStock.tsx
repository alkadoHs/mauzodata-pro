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
import { Head, Link } from "@inertiajs/react";
import { PaginatedProduct } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ChevronFirstIcon, ChevronLastIcon, DownloadCloud } from "lucide-react";
import { numberFormat } from "@/lib/utils";

export default function OutStock({ auth, products }: PageProps<{ products: PaginatedProduct }>) {
    return (
        <Authenticated user={auth.user}>
            <Head title="Users" />

            <section className="p-4 pt-0">
                <header>
                    <h2 className="text-xl my-3">Out of stock products</h2>

                    <div className="flex justify-between items-center mb-3">
                        <div>Total: {products.total}</div>
                        <div>
                            <Button>
                                <DownloadCloud className="mr-2 size-5" />
                                Download
                            </Button>
                        </div>
                    </div>
                </header>
                <div className="rounded-md border bg-slate-50 dark:bg-slate-800/50 dark:border-gray-800">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>S/N</TableHead>
                                <TableHead>PRODUCT</TableHead>
                                <TableHead>B.PRICE</TableHead>
                                <TableHead>STOCK</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products &&
                                products.data.map((product, index) => (
                                    <TableRow key={product.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{product.name}</TableCell>
                                        <TableCell>
                                            {numberFormat(product.buy_price)}
                                        </TableCell>
                                        <TableCell>
                                            {numberFormat(product.stock)}
                                        </TableCell>
                                        {/* <TableCell>

                                        </TableCell> */}
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>

                    <div className="flex items-center gap-3 justify-center my-3">
                        <Link
                            href={products.first_page_url}
                            disabled={!products.first_page_url}
                            preserveScroll
                        >
                            <Button
                                variant={"outline"}
                                size={"sm"}
                                disabled={!products.first_page_url}
                            >
                                <ChevronFirstIcon className="size-5 text-muted-foreground mr-2" />
                            </Button>
                        </Link>
                        <Link
                            href={products.prev_page_url}
                            disabled={!products.prev_page_url}
                            preserveScroll
                        >
                            <Button variant={"outline"} size={"sm"}>
                                <ArrowLeft className="size-5 text-muted-foreground mr-2" />
                                Prev
                            </Button>
                        </Link>
                        <span>
                            page - <b>{products.current_page}</b>
                        </span>
                        <Link
                            href={products.next_page_url}
                            disabled={!products.next_page_url}
                            preserveScroll
                        >
                            <Button variant={"outline"} size={"sm"}>
                                Next
                                <ArrowRight className="size-5 text-muted-foreground mr-l" />
                            </Button>
                        </Link>
                        <Link
                            href={products.last_page_url}
                            disabled={!products.last_page_url}
                            preserveScroll
                        >
                            <Button
                                variant={"outline"}
                                size={"sm"}
                                disabled={!products.last_page_url}
                            >
                                <ChevronLastIcon className="size-5 text-muted-foreground mr-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </Authenticated>
    );
};
