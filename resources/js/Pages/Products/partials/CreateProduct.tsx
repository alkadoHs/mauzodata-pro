import React, { FormEventHandler } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    Input,
    Accordion,
    AccordionItem,
} from "@nextui-org/react";
import { Plus } from "lucide-react";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";

export default function CreateProduct() {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const { data, setData, post, processing, reset, errors } = useForm({
        name: "",
        unit: "",
        product_id: "",
        buy_price: "",
        sale_price: "",
        stock: "",
        stock_alert: "",
        whole_sale: "0.00",
        whole_price: "0.00",
        expire_date: "",
    });

    const onsubmit: FormEventHandler = (e) => {
        e.preventDefault()

        post(route('products.store'), {
            onSuccess: () => {
                toast.success("Created successfully.");
                reset()
            },
        })
    }

    return (
        <>
            <Button
                color="primary"
                onPress={onOpen}
                startContent={<Plus size={20} />}
                size={"md"}
            >
                Add New
            </Button>
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                placement="top"
                size="4xl"
            >
                <ModalContent>
                    {(onClose) => (
                        <form onSubmit={onsubmit}>
                            <ModalHeader className="flex flex-col gap-1">
                                Create new product
                            </ModalHeader>
                            <ModalBody>
                                <div className="grid grid-cols-6 gap-4">
                                    <Input
                                        type="text"
                                        label="Product name"
                                        labelPlacement="outside"
                                        variant="bordered"
                                        className="col-span-6 md:col-span-3"
                                        value={data.name}
                                        onValueChange={(value) =>
                                            setData("name", value)
                                        }
                                        isInvalid={Boolean(errors.name)}
                                        errorMessage={errors.name}
                                        isRequired
                                    />
                                    <Input
                                        type="text"
                                        label="Unit (katon, kilo, box ...)"
                                        labelPlacement="outside"
                                        variant="bordered"
                                        className="col-span-6 md:col-span-3"
                                        value={data.unit}
                                        onValueChange={(value) =>
                                            setData("unit", value)
                                        }
                                        isInvalid={Boolean(errors.unit)}
                                        errorMessage={errors.unit}
                                        isRequired
                                    />
                                    <Input
                                        type="text"
                                        label="Buying price"
                                        labelPlacement="outside"
                                        variant="bordered"
                                        className="col-span-3 md:col-span-2"
                                        value={data.buy_price}
                                        onValueChange={(value) =>
                                            setData("buy_price", value)
                                        }
                                        isInvalid={Boolean(errors.buy_price)}
                                        errorMessage={errors.buy_price}
                                        isRequired
                                    />
                                    <Input
                                        type="text"
                                        label="Selling price"
                                        labelPlacement="outside"
                                        variant="bordered"
                                        className="col-span-3 md:col-span-2"
                                        value={data.sale_price}
                                        onValueChange={(value) =>
                                            setData("sale_price", value)
                                        }
                                        isInvalid={Boolean(errors.sale_price)}
                                        errorMessage={errors.sale_price}
                                        isRequired
                                    />
                                    <Input
                                        type="text"
                                        label="Stock"
                                        labelPlacement="outside"
                                        variant="bordered"
                                        className="col-span-3 md:col-span-2"
                                        value={data.stock}
                                        onValueChange={(value) =>
                                            setData("stock", value)
                                        }
                                        errorMessage={errors.stock}
                                        isInvalid={Boolean(errors.stock)}
                                        isRequired
                                    />
                                    <Input
                                        type="text"
                                        label="Stock alert"
                                        labelPlacement="outside"
                                        variant="bordered"
                                        className="col-span-3 md:col-span-2"
                                        value={data.stock_alert}
                                        onValueChange={(value) =>
                                            setData("stock_alert", value)
                                        }
                                        isInvalid={Boolean(errors.stock_alert)}
                                        errorMessage={errors.stock_alert}
                                        isRequired
                                    />
                                    <Input
                                        type="text"
                                        label="Expire Date"
                                        labelPlacement="outside"
                                        variant="bordered"
                                        className="col-span-3 md:col-span-2"
                                        value={data.expire_date}
                                        onValueChange={(value) =>
                                            setData("expire_date", value)
                                        }
                                        isInvalid={Boolean(errors.expire_date)}
                                        errorMessage={errors.expire_date}
                                    />
                                </div>
                                <Accordion>
                                    <AccordionItem
                                        key="1"
                                        aria-label="More product information"
                                        title="Whole sale informaton?"
                                    >
                                        <div className="grid grid-cols-6 space-x-4">
                                            <Input
                                                type="text"
                                                label="Whole sale stock"
                                                labelPlacement="outside"
                                                variant="bordered"
                                                className="col-span-3 md:col-span-2"
                                                value={data.whole_sale}
                                                onValueChange={(value) =>
                                                    setData("whole_sale", value)
                                                }
                                                isInvalid={Boolean(
                                                    errors.whole_sale
                                                )}
                                                errorMessage={errors.whole_sale}
                                                isRequired
                                            />
                                            <Input
                                                type="text"
                                                label="Whole sale price"
                                                labelPlacement="outside"
                                                variant="bordered"
                                                className="col-span-3 md:col-span-2"
                                                value={data.whole_price}
                                                onValueChange={(value) =>
                                                    setData(
                                                        "whole_price",
                                                        value
                                                    )
                                                }
                                                isInvalid={Boolean(
                                                    errors.whole_price
                                                )}
                                                errorMessage={errors.whole_price}
                                                isRequired
                                            />
                                        </div>
                                    </AccordionItem>
                                </Accordion>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    color="danger"
                                    variant="light"
                                    onPress={onClose}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" color="primary">
                                    Create
                                </Button>
                            </ModalFooter>
                        </form>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
