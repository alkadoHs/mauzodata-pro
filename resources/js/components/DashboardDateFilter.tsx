import * as React from "react";
import { router } from "@inertiajs/react";
import { addDays, format, subDays } from "date-fns";
import { Calendar as CalendarIcon, FilterIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

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

interface DashboardDateFilterProps extends React.HTMLAttributes<HTMLDivElement> {
    filters: {
        start_date?: string;
        end_date?: string;
    };
}

export function DashboardDateFilter({ className, filters }: DashboardDateFilterProps) {
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: filters.start_date ? new Date(filters.start_date) : undefined,
        to: filters.end_date ? new Date(filters.end_date) : undefined,
    });

    const applyFilter = (range: DateRange | undefined) => {
        router.get(route('dashboard'), {
            start_date: range?.from ? format(range.from, 'yyyy-MM-dd') : undefined,
            end_date: range?.to ? format(range.to, 'yyyy-MM-dd') : undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePresetChange = (value: string) => {
        const now = new Date();
        let from: Date | undefined;
        let to: Date | undefined;

        switch (value) {
            case 'today':
                from = now;
                to = now;
                break;
            case 'yesterday':
                from = subDays(now, 1);
                to = subDays(now, 1);
                break;
            case 'last7':
                from = subDays(now, 6);
                to = now;
                break;
            case 'last30':
                from = subDays(now, 29);
                to = now;
                break;
        }
        
        const newRange = { from, to };
        setDate(newRange);
        applyFilter(newRange);
    };

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <div className="flex items-center p-2 space-x-2">
                         <Select onValueChange={handlePresetChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select preset" />
                            </SelectTrigger>
                            <SelectContent position="popper">
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="yesterday">Yesterday</SelectItem>
                                <SelectItem value="last7">Last 7 days</SelectItem>
                                <SelectItem value="last30">Last 30 days</SelectItem>
                            </SelectContent>
                        </Select>
                         <Button onClick={() => applyFilter(date)}>
                            <FilterIcon className="size-4 mr-2"/>
                            Apply
                        </Button>
                    </div>
                    <div className="border-t">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}