import InputError from "@/Components/InputError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { PaymentMethod } from "@/lib/schemas";
import { PageProps } from "@/types";
import { Head, useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";
import { toast } from "sonner";
import CreatePaymentMethod from "./Partials/CreatePaymentMethod";
import DeletePaymentMethod from "./Partials/DeletePaymentMethod";
import { Heading4 } from "@/components/Typography/Heading4";

const Index = ({
    auth,
    paymentMethods,
}: PageProps<{ paymentMethods: PaymentMethod[] }>) => {
    
    return (
        <Authenticated user={auth.user}>
            <Head title="Payment methods" />

            <section className="space-y-4">
                <Heading4>Payment methods</Heading4>
                <CreatePaymentMethod />
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>S/N</TableHead>
                            <TableHead>NAME</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paymentMethods.map((payment, index) => (
                            <TableRow key={payment.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{payment.name}</TableCell>
                                <TableCell>
                                    <DeletePaymentMethod paymentMethod={payment} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </section>
        </Authenticated>
    );
};

export default Index;
