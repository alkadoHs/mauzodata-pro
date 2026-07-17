import { PaymentMethod, Product } from "@/lib/schemas";
import { Cart, PageProps } from "@/types";
import { Head, router, useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { numberFormat } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShoppingBag, UserPlus, X } from "lucide-react";
import { FormEventHandler } from "react";
import { NumericFormat } from "react-number-format";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import InputError from "@/Components/InputError";
import AddCustomer from "./partials/AddCustomer";
import { CartProductPicker } from "./partials/CartProductPicker";
import { CartLines } from "./partials/CartLines";

const CartIndex = ({
    auth,
    cart,
    products,
    paymentMethods,
    total,
}: PageProps<{
    cart: Cart;
    products: Product[];
    paymentMethods: PaymentMethod[];
    total: number;
}>) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        status: "paid",
        paid: "0",
        payment_method_id: "",
        print_invoice: true,
    });

    const items = cart?.cart_items ?? [];
    const itemCount = items.length;

    // Surface *why* the seller can't sell, instead of a dead button.
    const blockedReason =
        itemCount === 0
            ? "Add a product to this sale first."
            : data.status === "credit" && !cart?.customer
              ? "Select a customer for a credit sale."
              : null;

    const sellProducts: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("orders.complete"), {
            onSuccess: () => {
                reset();
                toast.success("Sale completed.");
            },
            onError: (errs) =>
                toast.error(errs.cart ?? errs.status ?? "Could not complete the sale."),
        });
    };

    return (
        <Authenticated user={auth.user}>
            <Head title="Sell" />

            {/* Same two-pane arrangement sellers know: search + cart on the left,
                sale details on the right. On mobile the search leads. */}
            <section className="grid grid-cols-1 gap-4 pb-24 lg:grid-cols-3 lg:pb-0">
                <div className="space-y-4 lg:col-span-2">
                    <CartProductPicker products={products} />
                    <CartLines items={items} />
                </div>

                <div className="space-y-4">
                    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                        {/* Total */}
                        <div className="flex items-baseline justify-between">
                            <span className="text-sm text-muted-foreground">
                                Total{" "}
                                {itemCount > 0 && (
                                    <span className="text-xs">
                                        ({itemCount} item{itemCount === 1 ? "" : "s"})
                                    </span>
                                )}
                            </span>
                            <b className="text-2xl font-semibold tabular-nums">
                                {numberFormat(total)}
                            </b>
                        </div>

                        {/* Customer */}
                        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                            <span className="text-sm text-muted-foreground">Customer</span>
                            {cart?.customer ? (
                                <span className="flex min-w-0 items-center gap-2">
                                    <b className="truncate">{cart.customer.name}</b>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-7 shrink-0"
                                        aria-label="Remove customer from this sale"
                                        title="Remove from this sale"
                                        onClick={() =>
                                            // Detaches only. Deleting the customer would
                                            // cascade away this cart and their credit history.
                                            router.delete(route("cart.removeCustomer"), {
                                                preserveScroll: true,
                                                onSuccess: () =>
                                                    toast.success("Customer removed"),
                                            })
                                        }
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </span>
                            ) : (
                                <AddCustomer />
                            )}
                        </div>
                    </div>

                    <form
                        onSubmit={sellProducts}
                        className="space-y-4 rounded-xl border border-border bg-card p-4"
                    >
                        <div className="space-y-1.5">
                            <Label htmlFor="payment_method_id">Payment method</Label>
                            {paymentMethods.length === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                    None set up — this sale will be recorded without one.
                                </p>
                            ) : (
                                <Select
                                    value={data.payment_method_id}
                                    onValueChange={(v) => setData("payment_method_id", v)}
                                >
                                    <SelectTrigger id="payment_method_id">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentMethods.map((pm) => (
                                            <SelectItem
                                                key={pm.id}
                                                value={String(pm.id)}
                                                className="uppercase"
                                            >
                                                {pm.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            <InputError message={errors.payment_method_id} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={data.status}
                                onValueChange={(v) => setData("status", v)}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Sale type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="paid">Paid Sale</SelectItem>
                                    <SelectItem value="credit">Credit Sale</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status} />
                        </div>

                        {data.status === "credit" && (
                            <div className="space-y-1.5">
                                <Label htmlFor="paid">Amount paid</Label>
                                <NumericFormat
                                    id="paid"
                                    value={data.paid}
                                    customInput={Input}
                                    thousandSeparator=","
                                    allowNegative={false}
                                    onChange={(e) => setData("paid", e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    The rest is recorded as debt for this customer.
                                </p>
                                <InputError message={errors.paid} />
                            </div>
                        )}

                        {/* Desktop action */}
                        <div className="hidden lg:block">
                            <Button
                                type="submit"
                                className="w-full gap-2"
                                disabled={processing || !!blockedReason}
                            >
                                <ShoppingBag className="size-4" />
                                {processing ? "Processing…" : "Sell product"}
                            </Button>
                            {blockedReason && (
                                <p className="mt-2 text-center text-xs text-muted-foreground">
                                    {blockedReason}
                                </p>
                            )}
                        </div>

                        {/* Mobile: sticky bar so Sell is always reachable */}
                        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
                            <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    {itemCount} item{itemCount === 1 ? "" : "s"}
                                </span>
                                <b className="text-lg tabular-nums">{numberFormat(total)}</b>
                            </div>
                            <Button
                                type="submit"
                                className="w-full gap-2"
                                disabled={processing || !!blockedReason}
                            >
                                <ShoppingBag className="size-4" />
                                {processing ? "Processing…" : "Sell product"}
                            </Button>
                            {blockedReason && (
                                <p className="mt-1 text-center text-xs text-muted-foreground">
                                    {blockedReason}
                                </p>
                            )}
                        </div>
                    </form>
                </div>
            </section>
        </Authenticated>
    );
};

export default CartIndex;
