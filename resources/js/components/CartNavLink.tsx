import { Link } from "@inertiajs/react";
import clsx from "clsx";
import { ReactNode } from "react";

interface Props {
    label: string;
    url: string;
    icon?: ReactNode;
}
const CartNavLink = ({ label, url, icon }: Props) => {
    return (
        <Link
            href={route(url)}
            as="button"
            className={clsx(
                "flex items-center gap-2 w-full text-left bg-inherit p-2 transition-colors duration-200 rounded-none hover:bg-gray-50 dark:hover:bg-gray-700",
                {
                    "bg-slate-700 rounded-b-none border-b-4 border-primary text-primary":
                        route().current()?.startsWith(url),
                }
            )}
        >
            <span>{icon}</span> <span>{label}</span>
        </Link>
    );
};

export default CartNavLink;
