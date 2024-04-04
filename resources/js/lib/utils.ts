import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function numberFormat(num: Number | string ) {
  return Intl.NumberFormat().format(Number(num));
}