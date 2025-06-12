import Authenticated from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import { Heading4 } from "@/components/Typography/Heading4";
import { TopSellingProductsPieChart } from "./charts/TopSellingProductsPieChart";
import { SupplierPurchasesBarChart } from "./charts/SupplierPurchasesBarChart";

export default function ReportsIndex({ auth }: PageProps) {
    return (
        <Authenticated user={auth.user}>
            <Head title="Reports"/>

            <div className="space-y-6">
                <Heading4>Visual Reports</Heading4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TopSellingProductsPieChart />
                    <SupplierPurchasesBarChart />
                </div>
            </div>

        </Authenticated>
    );
}