import React, { FormEventHandler, useState } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import { PageProps } from "@/types";
import { Product, Supplier } from "@/lib/schemas";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Heading4 } from "@/components/Typography/Heading4";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ReactSearchAutocomplete } from "react-search-autocomplete";
import { numberFormat } from "@/lib/utils";
import InputError from "@/Components/InputError";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

// CHANGE 1: quantity and cost are now strings to allow for empty inputs
interface POItem {
    product_id: number;
    name: string;
    quantity: string;
    cost: string;
}

export default function PurchaseOrderCreate({ auth, suppliers, products }: PageProps<{ suppliers: Supplier[], products: Product[] }>) {
    const [poItems, setPoItems] = useState<POItem[]>([]);
    
    const { data, setData, post, processing, errors } = useForm({
        supplier_id: "",
        notes: "",
        items: [] as { product_id: number; quantity: number; cost: number }[],
    });

    const handleAddProduct = (product: Product) => {
        if (poItems.some(item => item.product_id === product.id)) {
            toast.warning(`${product.name} is already in the list.`);
            return;
        }
        // CHANGE 2: Create new items with string values
        const newItem: POItem = {
            product_id: product.id,
            name: product.name,
            quantity: "1",
            cost: product.buy_price.toString(),
        };
        
        const updatedItems = [...poItems, newItem];
        setPoItems(updatedItems);
        // Convert to numbers when setting form data for the backend
        setData('items', updatedItems.map(({product_id, quantity, cost}) => ({
            product_id, 
            quantity: parseFloat(quantity) || 0,
            cost: parseFloat(cost) || 0
        })));
    };

    // CHANGE 3: The entire handleItemChange function is updated
    const handleItemChange = (index: number, field: 'quantity' | 'cost', value: string) => {
        const updatedItems = [...poItems];
        
        // Allow empty string but prevent non-numeric characters (except one dot)
        if (!/^\d*\.?\d*$/.test(value)) {
            return;
        }
        
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        setPoItems(updatedItems);
        
        // Always update the main form data with correctly parsed numbers
        const numericItems = updatedItems.map(item => ({
            product_id: item.product_id,
            quantity: parseFloat(item.quantity) || 0,
            cost: parseFloat(item.cost) || 0,
        }));
        setData('items', numericItems);
    };

    const handleRemoveItem = (index: number) => {
        const updatedItems = poItems.filter((_, i) => i !== index);
        setPoItems(updatedItems);
        const numericItems = updatedItems.map(item => ({
            product_id: item.product_id,
            quantity: parseFloat(item.quantity) || 0,
            cost: parseFloat(item.cost) || 0,
        }));
        setData('items', numericItems);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (data.items.length === 0) {
            toast.error("You must add at least one item to the transfer.");
            return;
        }
        post(route('purchase-orders.store'), {
            onSuccess: () => {
                toast.success("Purchase Order created.");
            },
        });
    };
    
    // CHANGE 4: Parse strings to float for total cost calculation
    const totalCost = poItems.reduce((acc, item) => {
        const cost = parseFloat(item.cost) || 0;
        const quantity = parseFloat(item.quantity) || 0;
        return acc + (cost * quantity);
    }, 0);

    return (
        <Authenticated user={auth.user}>
            <Head title="Create Purchase Order" />
            
            <Heading4>Create Purchase Order</Heading4>

            <form onSubmit={submit} className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="p-4 border rounded-lg">
                        <Label>Search & Add Products</Label>
                        <ReactSearchAutocomplete
                            items={products}
                            onSelect={handleAddProduct}
                            autoFocus
                            formatResult={(item: Product) => `${item.name} (${item.unit})`}
                            placeholder="Find product..."
                            styling={{ zIndex: 40 }}
                        />
                         <InputError message={errors.items} className="mt-2" />
                    </div>

                    <div className="rounded-md border">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="w-[120px]">Quantity</TableHead>
                                    <TableHead className="w-[150px]">Cost/Unit</TableHead>
                                    <TableHead className="text-right w-[150px]">Subtotal</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {poItems.length > 0 ? poItems.map((item, index) => (
                                    <TableRow key={item.product_id}>
                                        <TableCell>{item.name}</TableCell>
                                        {/* CHANGE 5: Update Inputs */}
                                        <TableCell>
                                            <Input 
                                                type="text" 
                                                value={item.quantity} 
                                                onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                type="text" 
                                                value={item.cost} 
                                                onChange={e => handleItemChange(index, 'cost', e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {numberFormat((parseFloat(item.quantity) || 0) * (parseFloat(item.cost) || 0))}
                                        </TableCell>
                                        <TableCell>
                                            <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveItem(index)}><Trash className="size-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={5} className="text-center h-24">No items added.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="space-y-4">
                     <div className="p-4 border rounded-lg space-y-4">
                         <Heading4>Details</Heading4>
                        <div className="grid gap-2">
                            <Label htmlFor="supplier_id">Supplier</Label>
                            <Select onValueChange={val => setData('supplier_id', val)} value={data.supplier_id}>
                                <SelectTrigger><SelectValue placeholder="Select a supplier" /></SelectTrigger>
                                <SelectContent>
                                    {suppliers.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                             <InputError message={errors.supplier_id} />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="notes">Notes</Label>
                             <Textarea id="notes" value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="Optional notes about this PO..." />
                             <InputError message={errors.notes} />
                        </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg space-y-2">
                        <Heading4>Summary</Heading4>
                        <div className="flex justify-between items-center text-lg">
                            <span>Total Cost:</span>
                            <span className="font-bold">{numberFormat(totalCost)}</span>
                        </div>
                        <Button type="submit" className="w-full" disabled={processing || poItems.length === 0}>
                            {processing ? 'Saving...' : 'Save Purchase Order'}
                        </Button>
                    </div>
                </div>
            </form>
        </Authenticated>
    );
}