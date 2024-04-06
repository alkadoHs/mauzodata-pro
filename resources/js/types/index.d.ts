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

interface CartProduct {
    id: number
    name: string;
    price: number;
    quantity: number;
}

interface Cart {
    [productId: number]: CartProduct;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>
> = T & {
    auth: {
        user: User;
    };
    ziggy: Config & { location: string };
};
