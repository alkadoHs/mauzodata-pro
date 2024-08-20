import { Badge } from '@/components/ui/badge'
import { Order } from '@/lib/schemas'
import React from 'react'

const OrderStatus = ({ order }: {order: Order}) => {
    const orderPrice = order?.order_items.reduce((acc, item) => acc + Number(item.price)* Number(item.quantity), 0)
  return (
    <>
     {order.status == 'credit' ? <Badge variant={'outline'}>Credit sale</Badge>: <Badge>Paid Sale</Badge>}
    </>
  )
}

export default OrderStatus