import { FormEventHandler } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import { Head, router, useForm } from "@inertiajs/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        tax_id: "",
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route("branches.store"), {
            onSuccess: () => router.visit(route("dashboard")),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <section className="px-3">
                <header>
                    <h2 className="text-2xl text-center my-3">
                        The Last step, Let's register your first shop/branch
                    </h2>
                </header>
                <form onSubmit={submit}>
                    <div>
                        <InputLabel htmlFor="name" value="Shop name" />
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
                    <div className="mt-4">
                        <InputLabel htmlFor="email" value="Email" />
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full"
                            autoComplete="username"
                            onChange={(e) => setData("email", e.target.value)}
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="phone" value="Phone number" />
                        <Input
                            id="phone"
                            type="number"
                            name="phone"
                            value={data.phone}
                            className="mt-1 block w-full"
                            autoComplete="username"
                            onChange={(e) => setData("phone", e.target.value)}
                            required
                        />
                        <InputError message={errors.phone} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="city" value="City/Region" />
                        <Input
                            id="city"
                            type="text"
                            name="city"
                            value={data.city}
                            className="mt-1 block w-full"
                            autoComplete="username"
                            onChange={(e) => setData("city", e.target.value)}
                            required
                        />
                        <InputError message={errors.city} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="address" value="Address" />
                        <Input
                            id="address"
                            type="text"
                            name="address"
                            value={data.address}
                            className="mt-1 block w-full"
                            autoComplete="address"
                            placeholder="P.o Box, 890, Kilimani "
                            onChange={(e) => setData("address", e.target.value)}
                            required
                        />
                        <InputError message={errors.address} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="tax_id" value="Tax Id" />
                        <Input
                            id="tax_id"
                            type="text"
                            name="tax_id"
                            value={data.tax_id}
                            className="mt-1 block w-full"
                            autoComplete="tax_id"
                            onChange={(e) => setData("tax_id", e.target.value)}
                            placeholder="(optional)"
                        />
                        <InputError message={errors.tax_id} className="mt-2" />
                    </div>
                    <div className="flex items-center justify-center mt-4">
                        <Button
                            type="submit"
                            color="primary"
                            className="ms-4 w-full"
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
