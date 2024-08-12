import * as React from "react";
import { CalendarIcon } from "@radix-ui/react-icons";
import { addDays, format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { paginatedOrder } from "@/lib/schemas";
import { FilterIcon } from "lucide-react";
import { toast } from "sonner";
import { router } from "@inertiajs/react";

export interface Filter {
    search?: string;
    dateBtn: DateBtn;
}

interface DateBtn {
    startDate?: Date | (() => Date);
    endDate?: Date;
}

export function SalesFilter({
    // orders,
    filters,
}: {
    // orders: paginatedOrder;
    filters?: Filter;
}) {
    const [startDate, setStartDate] = React.useState<Date | undefined>(
        filters?.dateBtn?.startDate
    );
    const [endDate, setEndDate] = React.useState<Date | undefined>(
        filters?.dateBtn?.endDate
    );

    const handleSubmit: React.FormEventHandler = (e) => {
        e.preventDefault();

        const data = { startDate, endDate };
        router.get(route("reports.sales"), data, { preserveState: true });
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button size={"icon"} variant={"outline"}>
                    <FilterIcon />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="flex w-auto flex-col space-y-2 p-2"
            >
                <div className="flex items-center gap-4">
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col md:flex-row tems-center gap-4"
                    >
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] justify-start text-left font-normal",
                                        !startDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? (
                                        format(startDate, "dd/MM/yyyy")
                                    ) : (
                                        <span>From date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                align="start"
                                className="flex w-auto flex-col space-y-2 p-2"
                            >
                                <div className="rounded-md border">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={setStartDate}
                                    />
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] justify-start text-left font-normal",
                                        !endDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? (
                                        format(endDate, "dd/MM/yyyy")
                                    ) : (
                                        <span>To date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                align="start"
                                className="flex w-auto flex-col space-y-2 p-2"
                            >
                                <div className="rounded-md border">
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={setEndDate}
                                    />
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Button type="submit" variant={"outline"}>
                            {" "}
                            <FilterIcon className="size-5 mr-2" />
                            Filter
                        </Button>
                    </form>
                </div>
            </PopoverContent>
        </Popover>
    );
}
