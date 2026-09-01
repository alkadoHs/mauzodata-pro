import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export type ComboOption = { id: number; label: string; hint?: string };

/**
 * Type-to-find, and add-what-isn't-there.
 *
 * Built on the same Command primitive as the till's product search, so
 * picking a client here feels like picking a product there. The part that
 * earns its keep is the last row: when what you typed matches nothing, it
 * offers to create it. A client who has never hired a lorry before is the
 * normal case at the moment somebody is recording that first trip, and
 * sending them off to another page to add a name — losing the half-filled
 * form on the way — is how a form stops being used.
 */
export function EntityCombobox({
    options,
    value,
    onChange,
    placeholder,
    searchPlaceholder,
    emptyText,
    createRoute,
    createResponseKey,
    createNoun,
    noneLabel,
    disabled,
}: {
    options: ComboOption[];
    /** Selected id, or null for nothing / the "none" row. */
    value: number | null;
    onChange: (id: number | null, option: ComboOption | null) => void;
    placeholder: string;
    searchPlaceholder: string;
    emptyText: string;
    /** Omit to make this a plain picker with no inline creation. */
    createRoute?: string;
    /** Key the endpoint returns the new record under, e.g. "client". */
    createResponseKey?: string;
    /** Used in the create row and its toast, e.g. "client". */
    createNoun?: string;
    /** When given, an explicit row for "nobody yet". */
    noneLabel?: string;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [creating, setCreating] = useState(false);
    // Anything added from here, so the new name is selectable immediately
    // rather than after the page next reloads its props.
    const [added, setAdded] = useState<ComboOption[]>([]);

    const all = useMemo(() => [...options, ...added], [options, added]);
    const selected = all.find((o) => o.id === value) ?? null;

    const trimmed = query.trim();
    const canCreate =
        !!createRoute &&
        trimmed.length >= 2 &&
        !all.some((o) => o.label.trim().toLowerCase() === trimmed.toLowerCase());

    const create = async () => {
        if (!createRoute || !createResponseKey) return;
        setCreating(true);
        try {
            const { data } = await axios.post(route(createRoute), { name: trimmed });
            const record = data[createResponseKey];
            const option: ComboOption = { id: record.id, label: record.name };

            setAdded((prev) => [...prev, option]);
            onChange(option.id, option);
            setQuery("");
            setOpen(false);
            toast.success(`${capitalise(createNoun ?? "record")} added`);
        } catch (error: any) {
            const errors = error?.response?.data?.errors;
            toast.error(
                errors ? Object.values(errors).flat()[0] as string
                       : `Could not add that ${createNoun ?? "record"}.`
            );
        } finally {
            setCreating(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between font-normal",
                        !selected && "text-muted-foreground"
                    )}
                >
                    <span className="truncate">
                        {selected ? selected.label : noneLabel && value === null ? noneLabel : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
            >
                <Command
                    // Names are matched by our own filter below; cmdk's fuzzy
                    // scoring would also hide the create row as you type.
                    shouldFilter={false}
                >
                    <CommandInput
                        value={query}
                        onValueChange={setQuery}
                        placeholder={searchPlaceholder}
                    />
                    <CommandList className="max-h-64">
                        {!canCreate && <CommandEmpty>{emptyText}</CommandEmpty>}

                        {noneLabel && (
                            <CommandGroup>
                                <CommandItem
                                    value="__none__"
                                    onSelect={() => {
                                        onChange(null, null);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 size-4",
                                            value === null ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <span className="text-muted-foreground">{noneLabel}</span>
                                </CommandItem>
                            </CommandGroup>
                        )}

                        <CommandGroup>
                            {all
                                .filter((o) =>
                                    trimmed === ""
                                        ? true
                                        : o.label.toLowerCase().includes(trimmed.toLowerCase())
                                )
                                .map((option) => (
                                    <CommandItem
                                        key={option.id}
                                        value={String(option.id)}
                                        onSelect={() => {
                                            onChange(option.id, option);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 size-4",
                                                value === option.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <span className="min-w-0 flex-1 truncate">
                                            {option.label}
                                        </span>
                                        {option.hint && (
                                            <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                                                {option.hint}
                                            </span>
                                        )}
                                    </CommandItem>
                                ))}
                        </CommandGroup>

                        {canCreate && (
                            <CommandGroup className="border-t">
                                <CommandItem
                                    value="__create__"
                                    disabled={creating}
                                    onSelect={create}
                                >
                                    {creating ? (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                    ) : (
                                        <Plus className="mr-2 size-4" />
                                    )}
                                    <span className="truncate">
                                        Add {createNoun ?? "record"}{" "}
                                        <b className="font-medium">“{trimmed}”</b>
                                    </span>
                                </CommandItem>
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function capitalise(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
}
