import { useState } from "react";
import { Head } from "@inertiajs/react";
import { PageProps } from "@/types";
import { Supplier } from "@/lib/schemas";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Heading4 } from "@/components/Typography/Heading4";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { SupplierFormDialog } from "./Partials/SupplierFormDialog";

export default function SupplierIndex({ auth, suppliers }: PageProps<{ suppliers: Supplier[] }>) {
    const [open, setOpen] = useState(false);

    return (
        <Authenticated user={auth.user}>
            <Head title="Suppliers" />
            <SupplierFormDialog open={open} onOpenChange={setOpen} />
            <div className="flex justify-between items-center mb-4">
                <Heading4>Suppliers</Heading4>
                <Button size={"sm"} onClick={() => setOpen(true)}>
                    <PlusCircle className="size-5 mr-2" />
                    New Supplier
                </Button>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Address</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {suppliers.length > 0 ? (
                            suppliers.map((supplier) => (
                                <TableRow key={supplier.id}>
                                    <TableCell>{supplier.name}</TableCell>
                                    <TableCell>{supplier.email}</TableCell>
                                    <TableCell>{supplier.phone}</TableCell>
                                    <TableCell>{supplier.address}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No suppliers found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </Authenticated>
    );
}