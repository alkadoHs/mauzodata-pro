import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Product } from "./schemas";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function numberFormat(num: number) {
  return Intl.NumberFormat().format(num)
}


export const transformProductsToOptions = (products: Product[]) => {
    return products.map((product) => ({
        id: product.id,
        value: product.name,
        label: product.name + ' / ' + product.unit + `(${numberFormat(product.stock)})`,
    }));
};
