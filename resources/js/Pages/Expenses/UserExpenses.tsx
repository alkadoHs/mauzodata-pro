import { DataTable } from "@/components/DataTable";
import { ExpenseItem } from "@/lib/schemas";
import { PageProps, User } from "@/types";
import { Head } from "@inertiajs/react";
import { userExpenseColumns } from "./Columns/UserExpensesColumns";
import ExpenseForm from "./Partials/ExpenseForm";
import Authenticated from "@/Layouts/AuthenticatedLayout";

const UserExpenses = ({ auth, expenseItems, users }: PageProps<{ expenseItems: ExpenseItem[], users: User[]}>) => {
    return (
        <Authenticated user={auth.user}>
            <Head title="My expenses" />

            <section className="">
                <div className="my-3">
                    <ExpenseForm user={auth.user} vendors={users} />
                </div>
                <div className="md:px-4 mx-auto py-8">
                    <DataTable columns={userExpenseColumns} data={expenseItems} />

                    <div className="flex items-center gap-3 justify-center my-3">
                    </div>
                </div>
            </section>
        </Authenticated>
    );
};

export default UserExpenses;
