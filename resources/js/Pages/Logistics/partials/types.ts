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
    /** How many journeys are already recorded against it. */
    trips_count: number;
};

export type Driver = {
    id: number;
    name: string;
    phone: string | null;
    license_number: string | null;
    is_active: boolean;
    notes: string | null;
    trips_count: number;
};

export type Client = {
    id: number;
    name: string;
    phone: string | null;
    notes: string | null;
    trips_count: number;
};

export type TripStatus = "in_transit" | "delivered" | "cancelled";

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
    in_transit: "On the road",
    delivered: "Delivered",
    cancelled: "Cancelled",
};

/** A row on the trips list — already totalled by the server. */
export type TripRow = {
    id: number;
    reference: string;
    dispatched_at: string | null;
    delivered_at: string | null;
    origin: string;
    destination: string;
    cargo: string | null;
    client: string | null;
    truck: string | null;
    driver: string | null;
    status: TripStatus;
    freight: number;
    expenses: number;
    margin: number;
    paid: number;
    balance: number;
};

/** The trip being looked at on its own page. */
export type TripDetail = {
    id: number;
    reference: string;
    origin: string;
    destination: string;
    cargo: string | null;
    weight_tons: number | null;
    freight_amount: number;
    status: TripStatus;
    dispatched_at: string | null;
    delivered_at: string | null;
    notes: string | null;
    truck: { id: number; label: string } | null;
    client: { id: number; name: string; phone: string | null } | null;
    driver: { id: number; name: string; phone: string | null } | null;
    truck_id: number;
    trip_client_id: number;
    driver_id: number | null;
};

export type TripFigures = {
    freight: number;
    expenses: number;
    margin: number;
    paid: number;
    balance: number;
};

export type TripExpense = {
    id: number;
    category: string;
    category_label: string;
    amount: number;
    description: string | null;
    spent_at: string | null;
};

export type TripPayment = {
    id: number;
    amount: number;
    paid_at: string | null;
    method: string | null;
    note: string | null;
};

/** The pick-lists a trip form needs. */
export type TripOptions = {
    trucks: { id: number; plate_number: string; name: string | null; status: TruckStatus }[];
    drivers: { id: number; name: string }[];
    clients: { id: number; name: string }[];
};
