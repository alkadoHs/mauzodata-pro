import InputError from "@/Components/InputError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";
import { toast } from "sonner";

const CreatePaymentMethod = () => {
    const { data, setData, errors, post, processing, reset } = useForm({
        name: "",
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route("payments.store"), {
            onSuccess: () => {
                toast.success("Created");
            },
        });

        reset();
    };
  return (
      <form onSubmit={submit} className="space-y-4 flex gap-4 flex-wrap">
          <div className="grid gap-1.5 w-full max-w-md">
              <Label htmlFor="name">Name</Label>
              <Input
                  type="text"
                  id="name"
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                  placeholder="name"
              />
              <InputError message={errors.name} />
          </div>

          <div>
              <Button disabled={processing} type="submit">
                  Save
              </Button>
          </div>
      </form>
  );
}

export default CreatePaymentMethod