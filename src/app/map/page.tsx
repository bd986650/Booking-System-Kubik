"use client";

import { OfficeConstructor } from "@/features/office-map";
import { useSearchParams } from "next/navigation";

export default function MapPage() {
    const searchParams = useSearchParams();
    const locationId = searchParams.get("locationId");
    
    return (
        <OfficeConstructor locationId={locationId ? Number(locationId) : null} />
    );
}