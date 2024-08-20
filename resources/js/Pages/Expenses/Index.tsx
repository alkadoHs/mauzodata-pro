import Authenticated from '@/Layouts/AuthenticatedLayout'
import { PageProps } from '@/types'
import { Head } from '@inertiajs/react'

const ExpenseIndex = ({ auth }: PageProps) => {
  return (
    <Authenticated user={auth.user}>
        <Head title='Expenses' />

        <section className="p-4">
            Expenses page
        </section>
    </Authenticated>
  )
}

export default ExpenseIndex