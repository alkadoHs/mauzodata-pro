import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash } from "lucide-react";
import { toast } from "sonner";
import { router } from "@inertiajs/react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { User } from "@/types";
import { Label } from "@/components/ui/label";

interface Expense {
    item: string;
    cost: string;
}

const ExpenseForm = ({ user, vendors }: { user: User; vendors: User[] }) => {
    const [expenses, setExpenses] = useState<Expense[]>([
        { item: "", cost: "" },
    ]);
    const [userId, setUserId] = useState(user.id.toString());

    const handleChange = (
        index: number,
        field: keyof Expense,
        value: string
    ) => {
        const newExpenses = [...expenses];
        newExpenses[index][field] = value;
        setExpenses(newExpenses);
    };

    const handleAddExpense = () => {
        setExpenses([...expenses, { item: "", cost: "" }]);
    };

    const handleRemoveExpense = (index: number) => {
        const newExpenses = [...expenses];
        newExpenses.splice(index, 1);
        setExpenses(newExpenses);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Check if any expense fields are empty
        if (
            expenses.some(
                (expense) =>
                    expense.item.trim() === "" || expense.cost.trim() === ""
            )
        ) {
            toast.error("Please fill all the inputs.");
            return;
        }

        router.post(
            route("expenses.store"),
            { expenses: expenses as any, user_id: userId },
            {
                onSuccess: () => toast.success("Submitted successfully."),
                preserveState: false,
            }
        );
    };

    const isExpenseFilled = (expense: Expense) => {
        return expense.item.trim() !== "" && expense.cost.trim() !== "";
    };

    const canAddExpense =
        expenses.length === 0 || isExpenseFilled(expenses[expenses.length - 1]);

    return (
        <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2 mb-2">
                <Label htmlFor="user_id">User(Vendor/Seller)</Label>
                <Select
                    value={userId}
                    name="user_id"
                    onValueChange={(value) => setUserId(value)}
                >
                    <SelectTrigger>
                        <SelectValue id="user_id" placeholder="Salect seller" />
                    </SelectTrigger>
                    <SelectContent>
                        {vendors.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id.toString()}>
                                {vendor.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {expenses.map((expense, index) => (
                <div key={index} className="flex gap-4 items-center">
                    <Input
                        type="text"
                        placeholder="Item"
                        value={expense.item}
                        onChange={(e) =>
                            handleChange(index, "item", e.target.value)
                        }
                    />
                    <Input
                        type="number"
                        placeholder="Cost"
                        value={expense.cost}
                        onChange={(e) =>
                            handleChange(index, "cost", e.target.value)
                        }
                    />
                    <Button
                        variant={"destructive"}
                        size={"icon"}
                        className="px-2"
                        onClick={() => handleRemoveExpense(index)}
                    >
                        <Trash className="size-5" />
                    </Button>
                </div>
            ))}

            <div className="space-x-4">
                <Button
                    variant={"outline"}
                    onClick={handleAddExpense}
                    disabled={!canAddExpense}
                >
                    Add Expense
                </Button>
                <Button type="submit">Submit</Button>
            </div>
        </form>
    );
};

export default ExpenseForm;
