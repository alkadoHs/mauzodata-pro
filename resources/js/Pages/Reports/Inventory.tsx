import { Heading4 } from '@/components/Typography/Heading4';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { PaginatedInventory, Inventory as InventoryType } from '@/lib/schemas';
import { numberFormat } from '@/lib/utils';
import { PageProps } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, ChevronFirstIcon, ChevronLastIcon, Eye, SearchIcon } from 'lucide-react';
import { ChangeEvent, FormEventHandler } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export default function Inventory({ auth, products, filters }: PageProps<{ products: PaginatedInventory, filters: { from_date?: string, to_date?: string, search?: string } }>) {
    
    const { data, setData, get } = useForm({
        from_date: filters.from_date || '',
        to_date: filters.to_date || '',
        search: filters.search || '',
    });

    const onSearchChange = useDebouncedCallback((e: ChangeEvent<HTMLInputElement>) => {
        setData('search', e.target.value);
        // Automatically submit form on search change after debounce
        router.get(route('reports.inventory'), { ...data, search: e.target.value }, { preserveState: true, replace: true });
    }, 500);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        get(route('reports.inventory'), {
            preserveState: true,
            replace: true,
        });
    };

    const calculateOpeningStock = (product: InventoryType): number => {
        const stockIn = (Number(product.stock_in_new) ?? 0) + (Number(product.stock_in_purchase) ?? 0);
        const stockOut = Number(product.stock_out) ?? 0;
        // Opening Stock = Closing Stock - IN + OUT
        return Number(product.stock) - stockIn + stockOut;
    };

    return (
        <Authenticated user={auth.user}>
            <Head title="Inventory Report" />

            <section>
                <Heading4>Inventory Report</Heading4>
                <form onSubmit={submit} className="py-6 flex flex-col lg:flex-row justify-between items-center gap-4">
                    <Input
                        type="search"
                        className="w-full lg:max-w-sm"
                        placeholder="Search product..."
                        defaultValue={data.search}
                        onChange={onSearchChange}
                    />
                    <div className="flex items-center gap-2">
                        <Input type="date" value={data.from_date} onChange={(e) => setData("from_date", e.target.value)} />
                        <span>-</span>
                        <Input type="date" value={data.to_date} onChange={(e) => setData("to_date", e.target.value)} />
                        <Button type="submit" size={"icon"} variant={"outline"}><SearchIcon className="size-5" /></Button>
                    </div>
                </form>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">Opening Stock</TableHead>
                                <TableHead className="text-right text-green-500">Stock In</TableHead>
                                <TableHead className="text-right text-red-500">Stock Out</TableHead>
                                <TableHead className="text-right">Closing Stock</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.data.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>{product.name} ({product.unit})</TableCell>
                                    <TableCell className="text-right">{numberFormat(calculateOpeningStock(product))}</TableCell>
                                    <TableCell className="text-right text-green-500">{numberFormat((Number(product.stock_in_new) ?? 0) + (Number(product.stock_in_purchase) ?? 0))}</TableCell>
                                    <TableCell className="text-right text-red-500">{numberFormat(Number(product.stock_out) ?? 0)}</TableCell>
                                    <TableCell className="text-right font-bold">{numberFormat(Number(product.stock))}</TableCell>
                                    <TableCell className="text-center">
                                        <Link href={route('reports.product-ledger', {product: product.id, ...data})}>
                                            <Button size="icon" variant="ghost"><Eye className="size-5"/></Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center gap-3 justify-center my-3">
                    <Link href={products.first_page_url} disabled={!products.first_page_url} preserveScroll><Button variant={"outline"} size={"sm"} disabled={!products.first_page_url}><ChevronFirstIcon className="size-5" /></Button></Link>
                    <Link href={products.prev_page_url} disabled={!products.prev_page_url} preserveScroll><Button variant={"outline"} size={"sm"} disabled={!products.prev_page_url}><ArrowLeft className="size-5" /> Prev</Button></Link>
                    <span>page - <b>{products.current_page}</b> of <b>{products.last_page}</b></span>
                    <Link href={products.next_page_url} disabled={!products.next_page_url} preserveScroll><Button variant={"outline"} size={"sm"} disabled={!products.next_page_url}>Next <ArrowRight className="size-5" /></Button></Link>
                    <Link href={products.last_page_url} disabled={!products.last_page_url} preserveScroll><Button variant={"outline"} size={"sm"} disabled={!products.last_page_url}><ChevronLastIcon className="size-5" /></Button></Link>
                </div>
            </section>
        </Authenticated>
    );
}