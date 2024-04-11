import CartLayout from "@/Layouts/CartLayout";
import { DataTable } from "@/components/DataTable";
import { Expense, ExpenseItem } from "@/lib/schemas";
import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import React from "react";
import { userExpenseColumns } from "./Columns/UserExpensesColumns";
import ExpenseForm from "./Partials/ExpenseForm";

const UserExpenses = ({ auth, expenseItems }: PageProps<{ expenseItems: ExpenseItem[]}>) => {
    return (
        <CartLayout user={auth.user}>
            <Head title="My expenses" />

            <section className="p-4">
                <div className="my-3">
                    <ExpenseForm />
                </div>
                <div className="px-4 mx-auto py-8">
                    <DataTable columns={userExpenseColumns} data={expenseItems} />

                    <div className="flex items-center gap-3 justify-center my-3">
                    </div>
                </div>
            </section>
        </CartLayout>
    );
};

export default UserExpenses;
