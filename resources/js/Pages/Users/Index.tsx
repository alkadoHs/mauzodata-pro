import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { PageProps, User } from "@/types";
import { Head } from "@inertiajs/react";
import CreateUser from "./Partials/CreateUser";
import { Branch } from "@/lib/schemas";

const UsersIndex = ({ auth, users, branches }: PageProps<{ users: User[], branches: Branch[] }>) => {
    return (
        <Authenticated user={auth.user}>
            <Head title="Users" />

            <section className="p-4 pt-0">
                <header>
                    <h2 className="text-xl my-3">System Users</h2>

                    <div className="flex justify-between items-center mb-3">
                        <div>
                            Total users:  {users.length}
                        </div>
                        <div>
                            <CreateUser branches={ branches } />
                        </div>
                    </div>
                </header>
                <div className="rounded-md border bg-slate-50 dark:bg-slate-800/50 dark:border-gray-800">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>S/N</TableHead>
                                <TableHead>NAME</TableHead>
                                <TableHead>EMAIL</TableHead>
                                <TableHead>PHONE</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users &&
                                users.map((user, index) => (
                                    <TableRow>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.phone}</TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </div>
            </section>
        </Authenticated>
    );
};

export default UsersIndex;
