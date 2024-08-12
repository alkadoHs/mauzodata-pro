import {
    Branch,
    CreditSalePayment,
    Customer,
    ExpenseItem,
    Order,
    Product,
    orderItem,
} from "@/lib/schemas";
import { Config } from "ziggy-js";

export interface User {
    id: number;
    company_id: number;
    branch_id: number;
    orders: Order[];
    expense_items: ExpenseItem[];
    credit_sale_payments: CreditSalePayment[];
    order_items: orderItem[];
    name: string;
    email: string;
    phone: string;
    role: "admin" | "seller" | "vendor";
    isActive: boolean;
    email_verified_at: string;
}

interface CartItem {
    id: number;
    product: Product;
    price: number;
    quantity: number;
}

interface Cart {
    cart_items: CartItem[];
    customer: Customer;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>
> = T & {
    auth: {
        user: User;
        branch: Branch;
        success: string;
        error: string;
        info: string;
    };
    ziggy: Config & { location: string };
};
