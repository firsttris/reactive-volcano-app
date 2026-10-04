import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Joins class names and lets later Tailwind classes override earlier ones */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
