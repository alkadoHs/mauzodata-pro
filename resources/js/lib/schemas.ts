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
    stock_alert: number;
    whole_sale: number;
    whole_price: number;
    expire_date: string;
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
