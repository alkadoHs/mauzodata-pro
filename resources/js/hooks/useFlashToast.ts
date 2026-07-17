import { usePage } from "@inertiajs/react";
import { useEffect } from "react";
import { toast } from "sonner";
import { PageProps } from "@/types";

/**
 * Toasts the server's flash messages (auth.success / error / info).
 *
 * Pages used to do this inline in the render body, which fires a toast on every
 * render rather than once per response. Run it as an effect keyed on the values.
 *
 * Only use this on pages whose controllers actually flash — pages that already
 * toast from an Inertia onSuccess callback would double up.
 */
export function useFlashToast() {
    const { auth } = usePage<PageProps>().props;
    const { success, error, info } = auth ?? {};

    useEffect(() => {
        if (success) toast.success(success);
    }, [success]);

    useEffect(() => {
        if (error) toast.error(error);
    }, [error]);

    useEffect(() => {
        if (info) toast.info(info);
    }, [info]);
}
