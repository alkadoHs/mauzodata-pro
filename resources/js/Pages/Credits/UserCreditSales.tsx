import Authenticated from '@/Layouts/AuthenticatedLayout'
import CartLayout from '@/Layouts/CartLayout'
import { PageProps } from '@/types'
import { Head } from '@inertiajs/react'
import React from 'react'

const UserCrediSales = ({ auth }: PageProps<{}>) => {
  return (
    <CartLayout user={auth.user}>
        <Head title='My credit sales' />

        <section className='p-4'>
            User Credit sales
        </section>
    </CartLayout>
  )
}

export default UserCrediSales