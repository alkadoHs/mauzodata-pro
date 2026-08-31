/** Shared shapes for the logistics registers. */

export type TruckStatus = "active" | "in_repair" | "sold";

export const TRUCK_STATUS_LABELS: Record<TruckStatus, string> = {
    active: "Active",
    in_repair: "In repair",
    sold: "Sold",
};

export type Truck = {
    id: number;
    plate_number: string;
    name: string | null;
    make: string | null;
    capacity_tons: number | null;
    status: TruckStatus;
    notes: string | null;
};

export type Driver = {
    id: number;
    name: string;
    phone: string | null;
    license_number: string | null;
    is_active: boolean;
    notes: string | null;
};

export type Client = {
    id: number;
    name: string;
    phone: string | null;
    notes: string | null;
};
