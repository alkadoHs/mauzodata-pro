import InputError from "@/Components/InputError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";
import { toast } from "sonner";

const CreateBranch = () => {
    const { data, setData, errors, post, processing, reset } = useForm({
        name: "",
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route("branches.store"), {
            onSuccess: () => {
                toast.success("Created");
            },
        });

        reset();
    };

  return (
      <form onSubmit={submit} className="space-y-4">
          <div className="gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                  type="text"
                  id="name"
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                  placeholder="Branch name"
              />
              <InputError message={errors.name} />
          </div>

          <div>
              <Button disabled={processing} type="submit">
                  Submit
              </Button>
          </div>
      </form>
  );
}

export default CreateBranch