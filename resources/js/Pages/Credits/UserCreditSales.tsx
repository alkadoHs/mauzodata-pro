import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell, Table
} from "@/components/ui/table";
import { paginatedCreditSale } from "@/lib/schemas";
import { numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head, router } from "@inertiajs/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { HistoryIcon } from "lucide-react";
import AddCreditPayment from "./Actions/AddCreditPayment";
import { Heading4 } from "@/components/Typography/Heading4";
import EmptyPlaceHolder from "@/components/EmptyPlaceHolder";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Input } from "@/components/ui/input";
import { ChangeEvent } from "react";
import { useDebouncedCallback } from "use-debounce";

dayjs.extend(relativeTime);

const UserCrediSales = ({
    auth,
    creditSales,
}: PageProps<{ creditSales: paginatedCreditSale }>) => {
     console.log(creditSales)
    const onSearchChange = useDebouncedCallback(
        (value?: ChangeEvent<HTMLInputElement>) => {
            if (value && value?.target.value) {
                router.visit(route("cart.credits"), {
                    data: { search: value.target.value },
                    only: ["creditSales"],
                    preserveScroll: true,
                    preserveState: true,
                });
            } else {
                router.visit(route("cart.credits"));
            }
        },
        1000
    );
    return (
        <Authenticated user={auth.user}>
            <Head title="My credit sales" />

            <section className="">
                <Heading4>Credit Sales</Heading4>

                <div className="w-full my-3">
                    <Input type="search" name="search" onChange={onSearchChange} placeholder="Search customer" />
                </div>
                <Accordion type="multiple" className="w-full">
                    {creditSales?.data?.length ? (
                        creditSales?.data?.map((credit) => (
                            <AccordionItem
                                key={credit.id}
                                value={credit?.order?.invoice_number}
                            >
                                <AccordionTrigger>
                                    <div className="max-w-sm lg:max-w-xl w-full flex gap-3 justify-between items-center">
                                        <p>INV - {`0${credit.order.id}`}</p>
                                        {credit?.order.customer ? (
                                            <p className="bg-amber-500/30">
                                                {credit?.order?.customer?.name}
                                            </p>
                                        ) : null}
                                        <p className="bg-red-500/30 p-1">
                                            Dept ={" "}
                                            {numberFormat(
                                                credit.order.order_items.reduce(
                                                    (acc, item) =>
                                                        acc +
                                                        Number(item.price) *
                                                            item.quantity,
                                                    0
                                                ) -
                                                    credit.credit_sale_payments.reduce(
                                                        (acc, item): number =>
                                                            acc +
                                                            Number(item.amount),
                                                        0
                                                    )
                                            )}
                                        </p>
                                        <p className="text-muted-foreground flex gap-2">
                                            <HistoryIcon className="size-4" />{" "}
                                            <span>
                                                {dayjs(
                                                    credit.order.created_at
                                                ).fromNow()}
                                            </span>
                                        </p>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="mb-8">
                                    <div>
                                        <div className="mt-3 sm:mt-4">
                                            <h4 className="text-xs font-semibold uppercase text-gray-800 dark:text-gray-200">
                                                Summary
                                            </h4>

                                            <ul className="mt-3 flex flex-col">
                                                <li className="inline-flex items-center gap-x-2 py-3 px-4 text-sm border text-gray-800 -mt-px first:rounded-t-lg first:mt-0 last:rounded-b-lg dark:border-gray-700 dark:text-gray-200">
                                                    <div className="flex items-center justify-between w-full">
                                                        <span>Customer</span>
                                                        <span>
                                                            {
                                                                credit?.order
                                                                    ?.customer
                                                                    ?.name
                                                            }
                                                        </span>
                                                    </div>
                                                </li>
                                                <li className="inline-flex items-center gap-x-2 py-3 px-4 text-sm border text-gray-800 -mt-px first:rounded-t-lg first:mt-0 last:rounded-b-lg dark:border-gray-700 dark:text-gray-200">
                                                    <div className="flex items-center justify-between w-full">
                                                        <span>Total Price</span>
                                                        <span>
                                                            {numberFormat(
                                                                credit.order.order_items.reduce(
                                                                    (
                                                                        acc,
                                                                        item
                                                                    ) =>
                                                                        acc +
                                                                        Number(
                                                                            item.price
                                                                        ) *
                                                                            item.quantity,
                                                                    0
                                                                )
                                                            )}
                                                        </span>
                                                    </div>
                                                </li>
                                                <li className="inline-flex items-center gap-x-2 py-3 px-4 text-sm border text-gray-800 -mt-px first:rounded-t-lg first:mt-0 last:rounded-b-lg dark:border-gray-700 dark:text-gray-200">
                                                    <div className="flex items-center justify-between w-full">
                                                        <span>Amount Paid</span>
                                                        <span>
                                                            {numberFormat(
                                                                Number(
                                                                    credit.credit_sale_payments.reduce(
                                                                        (
                                                                            acc,
                                                                            item
                                                                        ) =>
                                                                            acc +
                                                                            Number(
                                                                                item.amount
                                                                            ),
                                                                        0
                                                                    )
                                                                )
                                                            )}
                                                        </span>
                                                    </div>
                                                </li>
                                                <li className="inline-flex items-center gap-x-2 py-3 px-4 text-sm font-semibold bg-gray-50 border text-gray-800 -mt-px first:rounded-t-lg first:mt-0 last:rounded-b-lg dark:bg-slate-800 dark:border-gray-700 dark:text-gray-200">
                                                    <div className="flex items-center justify-between w-full">
                                                        <span>Dept </span>
                                                        <span>
                                                            {numberFormat(
                                                                credit.order.order_items.reduce(
                                                                    (
                                                                        acc,
                                                                        item
                                                                    ) =>
                                                                        acc +
                                                                        Number(
                                                                            item.price
                                                                        ) *
                                                                            item.quantity,
                                                                    0
                                                                ) -
                                                                    credit.credit_sale_payments.reduce(
                                                                        (
                                                                            acc,
                                                                            item
                                                                        ): number =>
                                                                            acc +
                                                                            Number(
                                                                                item.amount
                                                                            ),
                                                                        0
                                                                    )
                                                            )}
                                                        </span>
                                                    </div>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 mt-4 mb-2">
                                        <div className="flex gap-3 text-base">
                                            <Heading4>
                                                Payment statement
                                            </Heading4>
                                        </div>
                                        <AddCreditPayment credit={credit} />
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>S/N</TableHead>
                                                <TableHead>
                                                    RECEIVED BY
                                                </TableHead>
                                                <TableHead>AMOUNT</TableHead>
                                                <TableHead>DATE</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {credit.credit_sale_payments
                                                .length > 0 ? (
                                                credit.credit_sale_payments.map(
                                                    (payment, index) => (
                                                        <TableRow
                                                            key={payment.id}
                                                        >
                                                            <TableCell>
                                                                {index < 10
                                                                    ? `0${
                                                                          index +
                                                                          1
                                                                      }`
                                                                    : index + 1}
                                                            </TableCell>
                                                            <TableCell>
                                                                {
                                                                    payment.user
                                                                        .name
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {numberFormat(
                                                                    payment.amount
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {dayjs(
                                                                    payment.created_at
                                                                ).format(
                                                                    "DD MMM, YYYY HH:mm"
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                )
                                            ) : (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={4}
                                                        className="h-24 text-center"
                                                    >
                                                        No payments yet.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                        {/* <TableFooter>
                                        <TableRow>
                                            <TableHead>TOTAL PRICE</TableHead>
                                            <TableCell></TableCell>
                                            <TableCell></TableCell>
                                            <TableHead className="bg-violet-500/30">
                                                {numberFormat(
                                                    order.order_items.reduce(
                                                        (acc, item) =>
                                                            acc +
                                                            item.price *
                                                                item.quantity,
                                                        0
                                                    )
                                                )}
                                            </TableHead>
                                        </TableRow>
                                    </TableFooter> */}
                                    </Table>
                                </AccordionContent>
                            </AccordionItem>
                        ))
                    ) : (
                        <EmptyPlaceHolder message="No credit sales available." />
                    )}
                </Accordion>
            </section>
        </Authenticated>
    );
};

export default UserCrediSales;
