import { Input } from "@/components/ui/input";
import { CartItem } from "@/types";
import { useForm } from "@inertiajs/react";
import { FormEvent, useRef } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

const UpdateCartItem = ({ item }: { item: CartItem }) => {
    const formRef = useRef<HTMLFormElement>(null);
    const { data, setData, patch, errors, reset } = useForm({
        quantity: item.quantity,
    });


    const handleSubmit = useDebouncedCallback((e: FormEvent<Element>) => {
        e.preventDefault();

        patch(route("cart.update", item.id), {
            onSuccess: () => {
                toast.success("Cart item updated");
            },
            onError: () => {
                toast.error(errors.quantity);
                reset('quantity')
            },
            preserveScroll: true,
            preserveState: false,
        });
    }, 2000);

    return (
        <form ref={formRef} onSubmit={handleSubmit}>
            <Input
                type="number"
                value={data.quantity.toString()}
                className="max-w-20"
                onChange={(e) => {
                    setData("quantity", parseFloat(e.target.value));
                    formRef.current?.dispatchEvent(
                        new Event("submit")
                    );
                }}
            />
        </form>
    );
};

export default UpdateCartItem;
