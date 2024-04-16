import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { PageProps } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard({ auth }: PageProps) {
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Dashboard" />

            <section className="p-4">
                <Card>
                    <CardContent>
                        <p>Welcome Page</p>
                    </CardContent>
                </Card>
            </section>
        </AuthenticatedLayout>
    );
}
