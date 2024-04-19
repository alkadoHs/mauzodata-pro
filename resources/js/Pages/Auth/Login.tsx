import { useEffect, FormEventHandler } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import { Head, Link, useForm } from "@inertiajs/react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: true,
    });

    useEffect(() => {
        return () => {
            reset("password");
        };
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route("login"));
    };

    return (
        <>
            <Head title="Log in" />
            <div className="w-full lg:grid  lg:grid-cols-2 h-dvh overflow-clip">
                <div className="flex items-center justify-center py-12">
                    <div className="mx-auto grid w-[350px] gap-6">
                        <div className="grid gap-2 text-center">
                            <h1 className="text-3xl font-bold">Login</h1>
                            <p className="text-balance text-muted-foreground">
                                Enter your email below to login to your account
                            </p>

                            {status && (
                                <div className="mb-4 font-medium text-sm text-green-600">
                                    {status}
                                </div>
                            )}
                        </div>
                        <form onSubmit={submit} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    placeholder="Your email"
                                    required
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                />
                                <InputError message={errors.email} />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    <Link
                                        className="ml-auto inline-block text-sm underline"
                                        href={route("password.request")}
                                    >
                                        Forgot your password?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    required
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onCheckedChange={(checked) =>
                                        setData("remember", checked as boolean)
                                    }
                                />
                                <Label
                                    className="text-sm font-medium"
                                    htmlFor="remember"
                                >
                                    Remember me
                                </Label>
                            </div>
                            <Button className="w-full" type="submit">
                                Login
                            </Button>
                        </form>
                        <div className="mt-4 text-center text-sm">
                            Don't have an account?
                            <Link
                                as="button"
                                disabled
                                className="underline"
                                href={route("register")}
                            >
                                Sign up
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="hidden lg:block overflow-clip max-h-full">
                    <img
                        alt="Image"
                        className="h-full w-full object-cover"
                        src="/logside.svg"
                        
                    />
                </div>
            </div>
        </>
    );
}
