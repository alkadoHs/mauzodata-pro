import { FormEventHandler, useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import { PageProps } from "@/types";
import { Supplier } from "@/lib/schemas";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Heading4 } from "@/components/Typography/Heading4";
import { DataTable } from "@/components/DataTable";
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
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import InputError from "@/Components/InputError";
import { toast } from "sonner";

// Re-usable Create Supplier Form Component
const CreateSupplierForm = () => {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        phone: "",
        address: "",
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("suppliers.store"), {
            onSuccess: () => {
                reset();
                setOpen(false);
                toast.success("Supplier created successfully.");
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size={"sm"}>
                    <PlusCircle className="size-5 mr-2" />
                    New Supplier
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Supplier</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            required
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                        />
                         <InputError message={errors.email} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                            id="phone"
                            value={data.phone}
                            onChange={(e) => setData("phone", e.target.value)}
                        />
                         <InputError message={errors.phone} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            value={data.address}
                            onChange={(e) => setData("address", e.target.value)}
                        />
                         <InputError message={errors.address} />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={processing}>Save Supplier</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};


export default function SupplierIndex({ auth, suppliers }: PageProps<{ suppliers: Supplier[] }>) {
    return (
        <Authenticated user={auth.user}>
            <Head title="Suppliers" />
            <div className="flex justify-between items-center mb-4">
                <Heading4>Suppliers</Heading4>
                <CreateSupplierForm />
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