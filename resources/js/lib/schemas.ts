import { User } from "@/types";

export type PaginationLink = {
    url: string;
    label: string;
    active: boolean;
};

export type Product = {
    id: number;
    name: string;
    unit: string;
    buy_price: number;
    sale_price: number;
    stock: number;
    whole_sale: number;
    whole_price: number;
    expire_date: string;
    stock_alert: number;
};

export type PaginatedProduct = {
    data: Product[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    first_page_url: string;
    last_page_url: string;
    prev_page_url: string;
    next_page_url: string;
    from: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
};

export type Customer = {
    id: number;
    name: string;
    contact: string;
};

export type Branch = {
    id: number;
    name: string;
    email: string;
    city: string;
    address: string;
    tax_id: string;
};

export type Order = {
    id: number;
    branch: Branch;
    user: User;
    customer: Customer;
    order_items: orderItem[];
    invoice_number: string;
    paid: number;
    status: "paid" | "credit";
    created_at: string;
};

export type orderItem = {
    id: number;
    order: Order;
    product: Product;
    buy_price: number;
    price: number;
    quantity: number;
    total: number;
    profit: number;
};

export type paginatedOrder = {
    data: Order[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    first_page_url: string;
    last_page_url: string;
    prev_page_url: string;
    next_page_url: string;
    from: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
};

export type CreditSale = {
    id: number;
    order: Order;
    credit_sale_payments: CreditSalePayment[];
    created_at: string;
};

export type paginatedCreditSale = {
    data: CreditSale[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    first_page_url: string;
    last_page_url: string;
    prev_page_url: string;
    next_page_url: string;
    from: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
};

export type CreditSalePayment = {
    id: number;
    user: User;
    credit_sale: CreditSale;
    amount: number;
    created_at: string;
};

export type Expense = {
    id: number;
    branch: Branch;
    user: User;
    expense_items: ExpenseItem[];
    created_at: string;
};

export type ExpenseItem = {
    id: number;
    expense: Expense;
    item: string;
    cost: number;
    created_at: string;
};

export type StoreProduct = {
    id: number;
    name: string;
    unit: string;
    buy_price: number;
    sale_price: number;
    stock: number;
    whole_sale: number;
    whole_price: number;
    expire_date: string;
    stock_alert: number;
};

export type PaginatedStoreProduct = {
    data: Product[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    first_page_url: string;
    last_page_url: string;
    prev_page_url: string;
    next_page_url: string;
    from: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
};

export type product_sold = {
    product_id: number;
    product: Product;
    total_qty: number;
    total_price: number;
    total_buy_price: number;
    price: number;
    total_profit: number;
};


export type VendorProduct = {
    id: number;
    user_id: number;
    user: User;
    released_by: User;
    confirmed_by: User;
    product_id: number;
    product: Product;
    buy_price: number;
    sale_price: number;
    stock: number;
    sold: number;
    status: string;
}

export type NewStock = {
    id: number;
    product_id: number;
    product: Product;
    stock: number;
    new_stock: number;
    created_at: string;
}