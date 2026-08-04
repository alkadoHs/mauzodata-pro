import Receipt from "@/components/Receipt";
import { Order } from "@/lib/schemas";
import { PageProps } from "@/types";
import { Head, router } from "@inertiajs/react";
import { ArrowLeft, Printer } from "lucide-react";
import { useCallback, useEffect } from "react";

/**
 * Print-ready receipt. Deliberately outside the app layout and committed to a
 * light look — it's meant for paper. `print:` utilities strip the on-screen
 * chrome so only the receipt lands on the page.
 *
 * Once the print dialog closes the seller is carried back to the till, so
 * ringing up the next customer takes no navigation.
 */
const Index = ({
    invoice,
    returnTo,
}: PageProps<{ invoice: Order; returnTo: string }>) => {
    const goBack = useCallback(() => router.visit(returnTo), [returnTo]);

    useEffect(() => {
        // Give the layout a tick to settle before the print dialog snapshots it.
        const t = setTimeout(() => window.print(), 300);

        // Fires whether the sheet was printed or the dialog was dismissed —
        // browsers don't tell us which, and either way the seller is done here.
        window.addEventListener("afterprint", goBack);

        return () => {
            clearTimeout(t);
            window.removeEventListener("afterprint", goBack);
        };
    }, [goBack]);

    return (
        <>
            <Head title={`Receipt ${invoice.invoice_number ?? invoice.id}`} />

            <div className="min-h-dvh bg-neutral-100 py-6 text-neutral-900 print:bg-white print:py-0">
                {/* Screen-only controls — hidden on paper. The button is also
                    the way out on browsers that never fire `afterprint`. */}
                <div className="mx-auto mb-4 flex max-w-[340px] items-center justify-between print:hidden">
                    <button
                        type="button"
                        onClick={goBack}
                        className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50"
                    >
                        <ArrowLeft className="size-4" /> Done
                    </button>
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
