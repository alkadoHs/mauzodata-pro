import React, { FormEventHandler } from "react";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InputError from "@/Components/InputError";
import {
    Dialog,
    DialogContent,
    DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export default function AddCustomer() {
    const [open, setOpen] = React.useState(false);

    const { data, setData, processing, reset, errors, post } = useForm({
        name: "",
        contact: "",
    });

    const onsubmit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route("cart.addCustomer"), {
            onSuccess: () => toast.success("Added customer successfully."),
        });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger>
                    <Button size={"sm"} variant={"outline"}>
                        <Plus className="size-5 text-foreground mr-2" /> Add
                        Customer
                    </Button>
                </DialogTrigger>
                <DialogContent className="">
                    <form onSubmit={onsubmit}>
                        <div className="grid gap-4 my-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    type="text"
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                    placeholder="Customer name"
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="contact">
                                    Contact (phone,email etc)
                                </Label>
                                <Input
                                    type="text"
                                    id="contact"
                                    value={data.contact}
                                    onChange={(e) =>
                                        setData("contact", e.target.value)
                                    }
                                    placeholder="contact"
                                />
                                <InputError message={errors.contact} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant={"outline"}
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                            >
                                Add Customer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
