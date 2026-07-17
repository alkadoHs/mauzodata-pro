import { router, usePage } from "@inertiajs/react";
import { Building2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PageProps } from "@/types";

const ALL = "all";

export function BranchSwitcher() {
    const { auth } = usePage<PageProps>().props;

    // Sellers can't switch — show a static chip of their branch instead.
    if (!auth.canSwitchBranches) {
        if (!auth.branch) return null;
        return (
            <div className="hidden sm:flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
                <Building2 className="size-4 shrink-0" />
                <span className="max-w-[140px] truncate">{auth.branch.name}</span>
            </div>
        );
    }

    const current =
        auth.activeBranch === null ? ALL : String(auth.activeBranch);

    const handleChange = (value: string) => {
        if (value === current) return;
        router.post(
            route("branch.switch"),
            { branch_id: value },
            { preserveScroll: true, preserveState: false }
        );
    };

    return (
        <Select value={current} onValueChange={handleChange}>
            <SelectTrigger
                className="h-9 w-[180px] gap-2"
                aria-label="Switch branch"
            >
                <Building2 className="size-4 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={ALL}>All branches</SelectItem>
                {auth.branches.map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                        {branch.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
