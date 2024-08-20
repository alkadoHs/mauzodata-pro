import { DataTable } from "@/components/DataTable";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Head } from "@inertiajs/react";
import NewStockForm from "./partials/NewStockForm";
import { newStockColumns } from "@/columns/newStocks";
import { NewStock, Product } from "@/lib/schemas";
import { toast } from "sonner";

const Index = ({ auth, newStocks, products }: PageProps<{ newStocks: NewStock[], products: Product[] }>) => {
    if (auth.success) {
        toast.success(auth.success);
    } else if (auth.error) {
        toast.error(auth.error);
    } else if (auth.info) {
        toast.info(auth.info);
    }
    return (
        <Authenticated user={auth.user}>
            <Head title="New Stocks" />

            <section className="">
                <div className="my-3">
                    <NewStockForm products={products}/>
                </div>
                <div className="md:px-4 mx-auto py-8">
                    <DataTable columns={newStockColumns} data={newStocks} />

                    <div className="flex items-center gap-3 justify-center my-3"></div>
                </div>
            </section>
        </Authenticated>
    );
};

export default Index;
