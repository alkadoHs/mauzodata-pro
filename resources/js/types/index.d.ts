import { Customer, Product } from "@/lib/schemas";
import { Config } from "ziggy-js";

export interface User {
    id: number;
    company_id: number;
    branch_id: number;
    name: string;
    email: string;
    phone: string;
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
    };
    ziggy: Config & { location: string };
};
