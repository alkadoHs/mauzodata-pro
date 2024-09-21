import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { PageProps } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { numberFormat } from "@/lib/utils";

export default function Dashboard({
    auth,
    productsValue,
}: PageProps<{ productsValue: number }>) {
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Dashboard" />

            <section className="p-4">
                <Card>
                    <CardContent className="pt-4">
                        {auth.user.role == "admin" && (
                            <p className="text-3xl">
                                {" "}
                                <span className="">CAPITAL </span>
                                <span className="text-green-500">
                                    {numberFormat(productsValue)}
                                </span>
                            </p>
                        )}
                    </CardContent>
                </Card>
            </section>
        </AuthenticatedLayout>
    );
}
