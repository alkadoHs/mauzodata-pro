import Receipt from "@/components/Receipt";
import { Order } from "@/lib/schemas";
import { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Printer } from "lucide-react";
import { useEffect } from "react";

/**
 * Print-ready receipt. Deliberately outside the app layout and committed to a
 * light look — it's meant for paper. `print:` utilities strip the on-screen
 * chrome so only the receipt lands on the page.
 */
const Index = ({ invoice }: PageProps<{ invoice: Order }>) => {
    useEffect(() => {
        // Give the layout a tick to settle before the print dialog snapshots it.
        const t = setTimeout(() => window.print(), 300);

        return () => clearTimeout(t);
    }, []);

    return (
        <>
            <Head title={`Receipt ${invoice.invoice_number ?? invoice.id}`} />

            <div className="min-h-dvh bg-neutral-100 py-6 text-neutral-900 print:bg-white print:py-0">
                {/* Screen-only controls — hidden on paper */}
                <div className="mx-auto mb-4 flex max-w-[340px] items-center justify-between print:hidden">
                    <Link
                        href={route("orders.invoice", invoice.id)}
                        className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50"
                    >
                        <ArrowLeft className="size-4" /> Back
                    </Link>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-800"
                    >
                        <Printer className="size-4" /> Print again
                    </button>
                </div>

                <div className="mx-auto w-fit bg-white shadow-sm print:shadow-none">
                    <Receipt order={invoice} />
                </div>
            </div>
        </>
    );
};

export default Index;
