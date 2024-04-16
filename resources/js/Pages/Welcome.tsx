import { Head, router } from "@inertiajs/react";
import { PageProps } from "@/types";
import { Button } from "@/components/ui/button";
export default function Welcome({
    auth,
    laravelVersion,
    phpVersion,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
    return (
        <>
            <Head title="Welcome" />

            <section className="h-dvh max-w-md mx-auto grid items-center justify-center ">
                <div>
                    <h2 className="text-3xl text-center mb-6">Welcome at mauzodata sales system</h2>
                    <div className="grid gap-4">
                        <Button onClick={() => router.visit(route('login'))} className="rounded-3xl">Login with email</Button>
                        <Button variant={'outline'} onClick={() => router.visit(route('register'))} className="rounded-3xl">Create account</Button>
                    </div>
                </div>
            </section>
        </>
    );
}
