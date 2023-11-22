import InputError from "@/Components/InputError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Head, useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";
import { toast } from "sonner";
import CreateBranch from "./Partials/CreateBranch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Branch } from "@/lib/schemas";
import { Heading4 } from "@/components/Typography/Heading4";

const Index = ({ auth, branches }: PageProps<{ branches: Branch[] }>) => {
    return (
        <Authenticated user={auth.user}>
            <Head title="branches" />

            <section className="space-y-4">
                <Heading4>Branches</Heading4>
                <CreateBranch />

                <Table>
                    <TableHeader>
                        <TableHead>S/N</TableHead>
                        <TableHead>NAME</TableHead>
                    </TableHeader>
                    <TableBody>
                        {branches.map((branch, index) => (
                            <TableRow key={branch.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{branch.name}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </section>
        </Authenticated>
    );
};

export default Index;
