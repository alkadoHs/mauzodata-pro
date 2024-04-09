import { Link, Head } from "@inertiajs/react";
import { PageProps } from "@/types";

export default function Welcome({
    auth,
    laravelVersion,
    phpVersion,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
    return (
        <>
            <Head title="Welcome" />
            <div className="grid items-center justify-center">
                <button className="bg-blue-500 py-4 text-white w-fit px-6">
                    login
                </button>
            </div>
        </>
    );
}
