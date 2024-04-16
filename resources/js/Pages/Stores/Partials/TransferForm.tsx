import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Product {
    id: string;
    name: string;
}

interface Transfer {
    product_id: string;
    stock: string;
}

const ProductTransferForm: React.FC = () => {
    const [transfers, setTransfers] = useState<Transfer[]>([
        { product_id: "", stock: "" },
    ]);

    const products: Product[] = [
        { id: "1", name: "Product 1" },
        { id: "2", name: "Product 2" },
        { id: "3", name: "Product 3" },
        // Add more products as needed
    ];

    const handleChange = (
        index: number,
        field: keyof Transfer,
        value: string
    ) => {
        const newTransfers = [...transfers];
        newTransfers[index][field] = value;
        setTransfers(newTransfers);
    };

    const handleAddTransfer = () => {
        setTransfers([...transfers, { product_id: "", stock: "" }]);
    };

    const handleRemoveTransfer = (index: number) => {
        const newTransfers = [...transfers];
        newTransfers.splice(index, 1);
        setTransfers(newTransfers);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Check if any transfer fields are empty
        if (
            transfers.some(
                (transfer) =>
                    transfer.product_id.trim() === "" ||
                    transfer.stock.trim() === ""
            )
        ) {
            alert("Please fill in all transfer fields.");
            return;
        }

        console.log(transfers);
        // Handle form submission here, e.g., send data to server
    };

    const canAddTransfer =
        transfers.length === 0 ||
        transfers.every(
            (transfer) =>
                transfer.product_id.trim() !== "" &&
                transfer.stock.trim() !== ""
        );

    return (
        <form onSubmit={handleSubmit} className="grid gap-4">
            {transfers.map((transfer, index) => (
                <div key={index} className="flex gap-4 items-center">
                    
                    <Input
                        type="number"
                        placeholder="Stock"
                        value={transfer.stock}
                        onChange={(e) =>
                            handleChange(index, "stock", e.target.value)
                        }
                    />
                    <Button
                        variant={"destructive"}
                        size={"icon"}
                        className="px-2"
                        onClick={() => handleRemoveTransfer(index)}
                    >
                        <Trash className="size-5" />
                    </Button>
                </div>
            ))}
            <div className="space-x-4">
                <Button
                    variant={"outline"}
                    onClick={handleAddTransfer}
                    disabled={!canAddTransfer}
                >
                    Add Transfer
                </Button>
                <Button type="submit">Submit</Button>
            </div>
        </form>
    );
};

export default ProductTransferForm;
