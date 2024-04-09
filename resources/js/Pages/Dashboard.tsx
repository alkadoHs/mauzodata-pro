import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { PageProps } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard({ auth }: PageProps) {
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Dashboard" />

            <Card>
                <CardContent>
                    <p>Welcome Page</p>
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
