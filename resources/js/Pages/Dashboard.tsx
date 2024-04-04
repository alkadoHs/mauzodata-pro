import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { PageProps } from "@/types";
import { Button, Card, CardBody, Input } from "@nextui-org/react";

export default function Dashboard({ auth }: PageProps) {
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Dashboard" />

            <Card>
                <CardBody>
                    <div className="my-3">
                        <Link href={route("logout")} method="post" as="button">
                            Logout
                        </Link>
                    </div>
                    <div className="space-y-4">
                        <Input
                            variant="bordered"
                            color="secondary"
                            placeholder="first name"
                        />
                        <Button color="primary">Login</Button>
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardBody>
                    <div className="my-3">
                        <Link href={route("logout")} method="post" as="button">
                            Logout
                        </Link>
                    </div>
                    <div className="space-y-4">
                        <Input
                            variant="bordered"
                            color="secondary"
                            placeholder="first name"
                        />
                        <Button color="primary">Login</Button>
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardBody>
                    <div className="my-3">
                        <Link href={route("logout")} method="post" as="button">
                            Logout
                        </Link>
                    </div>
                    <div className="space-y-4">
                        <Input
                            variant="bordered"
                            color="secondary"
                            placeholder="first name"
                        />
                        <Button color="primary">Login</Button>
                    </div>
                </CardBody>
            </Card>
        </AuthenticatedLayout>
    );
}
