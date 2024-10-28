import { Heading4 } from '@/components/Typography/Heading4';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Authenticated from '@/Layouts/AuthenticatedLayout'
import { PaginatedInventory } from '@/lib/schemas';
import { numberFormat } from '@/lib/utils';
import { PageProps } from '@/types'
import { Head, Link, router, useForm } from '@inertiajs/react'
import { ArrowLeft, ArrowRight, ChevronLastIcon, SearchIcon } from 'lucide-react';
import React, { ChangeEvent, FormEventHandler } from 'react'
import { useDebouncedCallback } from 'use-debounce';


const Inventory = ({ auth,products }: PageProps<{ products: PaginatedInventory}>) => {
    const { data, setData, get} = useForm({
        fromDate: '',
        toDate: ''
    })

    const submit: FormEventHandler = (e) => {
        e.preventDefault()

        get(route('reports.inventory'), {
            preserveState: true,
            preserveScroll: true,
        })
    }

    const onSearchChange = useDebouncedCallback(
        (value?: ChangeEvent<HTMLInputElement>) => {
            if (value && value?.target.value) {
                router.visit(route("reports.inventory"), {
                    data: { search: value.target.value },
                    preserveScroll: true,
                    preserveState: true,
                });
            } else {
                router.visit(route("reports.inventory"));
            }
        },
        1000
    );

  return (
      <Authenticated user={auth.user}>
          <Head title="Inventory system" />

          <section>
              <Heading4>Inventory System</Heading4>
              <br />
              <div className="pb-6 flex flex-col lg:flex-row justify-end items-center">
                  <Input
                      type="search"
                      className="w-full sm:max-w-[44%] mr-auto"
                      placeholder="Search product"
                      onChange={onSearchChange}
                  />

                  <form onSubmit={submit} className="flex items-center gap-4">
                      <Input
                          type="date"
                          name="from_date"
                          value={data.fromDate}
                          onChange={(e) => setData("fromDate", e.target.value)}
                      />
                      <span>-</span>
                      <Input
                          type="date"
                          name="to_date"
                          value={data.toDate}
                          onChange={(e) => setData("toDate", e.target.value)}
                      />
                      <Button type="submit" size={"icon"} variant={"outline"}>
                          <SearchIcon className="size-6" />
                      </Button>
                  </form>
              </div>
              <Table>
                  <TableHeader>
                      <TableHead>PRODUCT</TableHead>
                      <TableHead className="text-right">C.STOCK</TableHead>
                      <TableHead className="text-right">OUT</TableHead>
                      <TableHead className="text-right">IN</TableHead>
                      <TableHead className="text-right">TRANSFER</TableHead>
                      <TableHead className="text-right">FREQUENCY</TableHead>
                      <TableHead className="text-right">SALES</TableHead>
                      <TableHead className="text-right">PROFIT</TableHead>
                      <TableHead className="text-right">AV.SALES</TableHead>
                      <TableHead className="text-right">AV.PROFIT</TableHead>
                      <TableHead className="text-right">Prev.STOCK</TableHead>
                  </TableHeader>
                  <TableBody>
                      {products.data.map((product) => (
                          <TableRow key={product.id}>
                              <TableCell>{product.name}</TableCell>
                              <TableCell className="text-right">
                                  {numberFormat(product.stock)}
                              </TableCell>
                              <TableCell className="text-right">
                                  {numberFormat(
                                      product.order_items_sum_quantity
                                  )}
                              </TableCell>
                              <TableCell className="text-right">
                                  {numberFormat(product.new_stocks_sum_stock)}
                              </TableCell>
                              <TableCell className="text-right">
                                  {numberFormat(
                                      product.stock_transfers_sum_stock
                                  )}
                              </TableCell>
                              <TableCell className="text-right">
                                  {numberFormat(product.order_items_count)}
                              </TableCell>
                              <TableCell className="text-right">
                                  {numberFormat(product.order_items_sum_total)}
                              </TableCell>
                              <TableCell className="text-right">
                                  {numberFormat(product.order_items_sum_profit)}
                              </TableCell>
                              <TableCell className="text-right">
                                  {numberFormat(product.order_items_avg_total)}
                              </TableCell>
                              <TableCell className="text-right">
                                  {numberFormat(product.order_items_avg_profit)}
                              </TableCell>
                              <TableCell className="text-right">
                                  {numberFormat(
                                      Number(product.stock) +
                                          Number(
                                              product.order_items_sum_quantity
                                          ) + Number(
                                              product.stock_transfers_sum_stock
                                          )
                                  )}
                              </TableCell>
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
                          <ChevronLastIcon className="size-5 text-muted-foreground mr-2" />
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
          </section>
      </Authenticated>
  );
}

export default Inventory
