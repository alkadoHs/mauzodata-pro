import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Product } from "./schemas";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function numberFormat(num: number) {
    return Intl.NumberFormat().format(num);
}

export const transformProductsToOptions = (products: Product[]) => {
    return products.map((product) => ({
        id: product.id,
        value: product.name,
        label:
            product.name +
            " / " +
            product.unit +
            `(${numberFormat(product.stock)})`,
    }));
};

export function dateFormat(date: string) {
    return dayjs(date).format("DD/MM/YYYY");
}


export function dateTimeFormat(date: string) {
    return dayjs(date).format("DD/MM/YYYY H:m");
}


export function dateFormatFilter(date: string) {
    return dayjs(date).format("YYYY-MM-DD");
}
