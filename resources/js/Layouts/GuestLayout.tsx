import ApplicationLogo from "@/Components/ApplicationLogo";
import { Link } from "@inertiajs/react";
import { PropsWithChildren } from "react";

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-slate-100 dark:bg-transparent">
            <div>
                <Link href="/">
                    <ApplicationLogo className="w-20 h-20 fill-current text-slate-500" />
                </Link>
            </div>

            <div className="max-w-md px-4 mx-auto w-full">
                <div>{children}</div>
            </div>
        </div>
    );
}
