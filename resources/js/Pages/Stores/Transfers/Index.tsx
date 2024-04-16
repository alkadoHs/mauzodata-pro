import StoreLayout from '@/Layouts/StoreLayout'
import { PageProps } from '@/types'
import { Head } from '@inertiajs/react'
import ProductTransferForm from '../Partials/TransferForm'
import { PaginatedStoreProduct } from '@/lib/schemas'

const TransferIndex = ({ auth, products }: PageProps<{ products: PaginatedStoreProduct}>) => {
  return (
    <StoreLayout user={auth.user} >
        <Head title='Transfer Product' />

        <section className='p-4'>
            <ProductTransferForm/>
        </section>
    </StoreLayout>
  )
}

export default TransferIndex