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
    role: "admin" | "manager" | "seller";
    isActive: boolean;
    email_verified_at: string;
}

interface CartItem {
    id: number;
    product: Product;
    price: number;
    /** A fixed amount off this line, not a percentage. */
    discount: number;
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
        branch: Branch | null;
        activeBranch: number | "all" | null;
        canSwitchBranches: boolean;
        branches: Branch[];
        /** Which of the two systems is on screen — drives the whole sidebar. */
        workspace: "shop" | "logistics";
        /** Whether this user has a haulage business to switch to at all. */
        hasLogistics: boolean;
        success: string;
        error: string;
        info: string;
    };
    ziggy: Config & { location: string };
};
