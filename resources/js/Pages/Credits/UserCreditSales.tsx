import Authenticated from "@/Layouts/AuthenticatedLayout";
import CartLayout from "@/Layouts/CartLayout";
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
    TableCell,
    TableFooter,
    Table,
} from "@/components/ui/table";
import { CreditSale } from "@/lib/schemas";
import { numberFormat } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { HistoryIcon} from "lucide-react";
import React from "react";

dayjs.extend(relativeTime);

const UserCrediSales = ({
    auth,
    creditSales,
}: PageProps<{ creditSales: CreditSale[] }>) => {
    return (
        <CartLayout user={auth.user}>
            <Head title="My credit sales" />

            <section className="p-4">
                <Accordion type="multiple" className="w-full">
                    {creditSales.map((credit) => (
                        <AccordionItem
                            key={credit.id}
                            value={credit?.order?.invoice_number}
                        >
                            <AccordionTrigger>
                                <div className="max-w-sm lg:max-w-xl w-full flex gap-3 justify-between items-center">
                                    <p>INV - {`0${credit.order.id}`}</p>
                                    {credit?.order.customer ? (
                                        <p className="bg-amber-500/30">
                                            {credit.order.customer.name}
                                        </p>
                                    ) : null}
                                    <p className="bg-violet-500/30 p-1">
                                        PAID = {numberFormat(credit.order.paid)}{" "}
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
                            <AccordionContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>S/N</TableHead>
                                            <TableHead>USER</TableHead>
                                            <TableHead>AMOUNT</TableHead>
                                            <TableHead>DATE</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {credit.credit_sale_payments.length > 0 ? (
                                            credit.credit_sale_payments.map(
                                                (payment, index) => (
                                                    <TableRow key={payment.id}>
                                                        <TableCell>
                                                            {index < 10
                                                                ? `0${
                                                                      index + 1
                                                                  }`
                                                                : index + 1}
                                                        </TableCell>
                                                        <TableCell>
                                                            {payment.user.name}
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
                    ))}
                </Accordion>
            </section>
        </CartLayout>
    );
};

export default UserCrediSales;
