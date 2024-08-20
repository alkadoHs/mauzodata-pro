import InputError from '@/Components/InputError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Authenticated from '@/Layouts/AuthenticatedLayout'
import { PageProps } from '@/types'
import { Head, useForm } from '@inertiajs/react'
import React, { FormEventHandler } from 'react'
import { toast } from 'sonner'

const Index = ({auth}: PageProps) => {
    const { data, setData, errors, post, processing, reset} = useForm({
        name: ''
    })

    const submit: FormEventHandler = (e) => {
        e.preventDefault()

        post(route('branches.store'), {
            onSuccess: () => {
                toast.success("Created")
            }
        })

        reset()
    }
  return (
      <Authenticated user={auth.user}>
          <Head title="branches" />

          <section>
              <form onSubmit={submit} className='space-y-4'>
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
                    <Button disabled={processing} type='submit'>Submit</Button>
                  </div>
              </form>
          </section>
      </Authenticated>
  );
}

export default Index