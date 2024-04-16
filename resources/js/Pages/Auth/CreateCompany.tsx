import { FormEventHandler } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import { Head, router, useForm } from "@inertiajs/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CreateCompany() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route("companies.store"), {
            onSuccess: () => router.visit(route("branches.create")),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <section className="px-3">
                <header>
                    <h2 className="text-2xl text-center my-3">
                        Let's make registration of your company!
                    </h2>
                    <p className="text-muted-foreground text-lg pb-3 text-center text-balance">
                        Give the perfect name of your company here, mauzodata system
                        will use this company name to register your shops, stores,
                        staff members and products.
                    </p>
                </header>
                <form onSubmit={submit}>
                    <div>
                        <InputLabel htmlFor="name" value="Your company" />
                        <Input
                            id="name"
                            name="name"
                            value={data.name}
                            className="mt-1 block w-full"
                            autoComplete="name"
                            autoFocus={true}
                            onChange={(e) => setData("name", e.target.value)}
                            required
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>
                    <div className="flex items-center justify-end mt-4">
                        <Button
                            type="submit"
                            color="primary"
                            className="ms-4"
                            disabled={processing}
                        >
                            Register
                        </Button>
                    </div>
                </form>
            </section>
        </GuestLayout>
    );
}
