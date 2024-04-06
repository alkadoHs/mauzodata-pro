import { PaginatedProduct } from '@/lib/schemas';
import { router, useForm } from '@inertiajs/react';
import { Autocomplete, AutocompleteItem, Button } from '@nextui-org/react';
import { PlusIcon } from 'lucide-react';
import React, { FormEventHandler } from 'react'
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';

const AddToCart = ({ products }: { products:PaginatedProduct}) => {
     const [isLoading, setIsloading] = React.useState(false);

     const { data, setData, post, errors } = useForm({
         product_id: "",
     });

     const addCartItem: FormEventHandler = (e) => {
         e.preventDefault();
         post(route("cart.add"), {
             onSuccess: () => toast.success("Added to acrt"),
             onError: () => toast.warning("This product is alredy available to the cart.")
         });
     };

    const searchProduct = useDebouncedCallback((value: string) => {
        router.get(
            route("cart.index"),
            { search: value },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsloading(true),
                onFinish: () => setIsloading(false),
            }
        );
    }, 1000);
  return (
      <form onSubmit={addCartItem} className='flex items-center gap-2'>
          <Autocomplete
              defaultItems={products.data}
              label="Products"
              size="sm"
              placeholder="Find product"
              className="max-w-xs"
              onSelectionChange={(key): void =>
                  setData("product_id", key as string)
              }
              onInputChange={searchProduct}
              isLoading={isLoading}
              isRequired
          >
              {(product) => (
                  <AutocompleteItem key={product.id}>
                      {product.name}
                  </AutocompleteItem>
              )}
          </Autocomplete>
          <Button type="submit" isIconOnly color='secondary'>
            <PlusIcon className='size-6' />
          </Button>
      </form>
  );
}

export default AddToCart