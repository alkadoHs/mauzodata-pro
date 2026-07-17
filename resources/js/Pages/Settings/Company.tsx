import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import { PageProps } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InputError from "@/Components/InputError";
import { FormEventHandler } from "react";
import { toast } from "sonner";
import { Building2 } from "lucide-react";

type Company = {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    tax_id: string | null;
};

export default function CompanySettings({
    auth,
    company,
}: PageProps<{ company: Company }>) {
    const { data, setData, patch, processing, errors } = useForm({
        name: company?.name ?? "",
        phone: company?.phone ?? "",
        email: company?.email ?? "",
        address: company?.address ?? "",
        tax_id: company?.tax_id ?? "",
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route("company.update"), {
            preserveScroll: true,
            onSuccess: () => toast.success("Company settings saved"),
        });
    };

    return (
        <Authenticated user={auth.user}>
            <Head title="Company settings" />

            <section className="space-y-4">
                <header>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Company settings
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Your business identity. Branches keep their own address and
                        phone for receipts.
                    </p>
                </header>

                <form
                    onSubmit={submit}
                    className="max-w-2xl space-y-4 rounded-xl border border-border bg-card p-4"
                >
                    <div className="flex items-center gap-3 border-b border-border pb-4">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                            <Building2 className="size-5" />
                        </span>
                        <div className="min-w-0">
                            <p className="truncate font-medium">{company?.name}</p>
                            <p className="text-xs text-muted-foreground">
                                Company #{company?.id}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="name">Company name *</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={data.phone}
                                onChange={(e) => setData("phone", e.target.value)}
                                placeholder="07xxxxxxxx"
                            />
                            <InputError message={errors.phone} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData("email", e.target.value)}
                                placeholder="info@example.com"
                            />
                            <InputError message={errors.email} />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={data.address}
                                onChange={(e) => setData("address", e.target.value)}
                                placeholder="P.O. Box …"
                            />
                            <InputError message={errors.address} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="tax_id">TIN / Tax number</Label>
                            <Input
                                id="tax_id"
                                value={data.tax_id}
                                onChange={(e) => setData("tax_id", e.target.value)}
                                placeholder="Optional"
                            />
                            <InputError message={errors.tax_id} />
                        </div>
                    </div>

                    <div className="flex justify-end border-t border-border pt-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? "Saving…" : "Save changes"}
                        </Button>
                    </div>
                </form>
            </section>
        </Authenticated>
    );
}
