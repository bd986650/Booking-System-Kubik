"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OfficeConstructor } from "@/features/office-map";
import { useAuthStore } from "@/features/auth";
import { organizationsApi, type Location } from "@/entities/organization";
import { isWorkspaceAdmin } from "@/shared/lib/roles";

export default function MapPage() {
    const searchParams = useSearchParams();
  const queryLocationId = searchParams.get("locationId");
  const mode = searchParams.get("mode");
  const viewMode = mode === "view";

  const { user, accessToken } = useAuthStore();

  const isWsAdmin = useMemo(() => isWorkspaceAdmin(user || null), [user]);

  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    queryLocationId ? Number(queryLocationId) : null
  );

  // Для не workspace-админов используем либо параметр, либо их текущую локацию
  useEffect(() => {
    if (viewMode && isWsAdmin) return;
    if (queryLocationId) {
      setSelectedLocationId(Number(queryLocationId));
    } else if (user?.locationId) {
      setSelectedLocationId(user.locationId);
    }
  }, [viewMode, isWsAdmin, queryLocationId, user?.locationId]);

  // Для workspace-админа в режиме просмотра — выбор локации из списка организации
  useEffect(() => {
    if (!viewMode || !isWsAdmin) return;
    if (!user?.organizationId || !accessToken) return;

    setLoadingLocations(true);
    (async () => {
      if (!user.organizationId) {
        setLoadingLocations(false);
        return;
      }
      const res = await organizationsApi.getLocationsByOrganization(
        user.organizationId
      );
      if (res.data) {
        setLocations(res.data);
        if (!selectedLocationId && res.data.length > 0) {
          setSelectedLocationId(res.data[0].id);
        }
      }
      setLoadingLocations(false);
    })();
  }, [viewMode, isWsAdmin, user?.organizationId, accessToken, selectedLocationId]);

  const editMode = !viewMode;

  const currentLocationName =
    locations.find((l) => l.id === selectedLocationId)?.name ||
    (user?.locationName || (selectedLocationId ? `Локация #${selectedLocationId}` : "Не выбрана"));
    
    return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-1">
        <OfficeConstructor
          locationId={selectedLocationId ?? null}
          editMode={editMode}
          locations={viewMode && isWsAdmin ? locations : undefined}
          loadingLocations={viewMode && isWsAdmin ? loadingLocations : false}
          selectedLocationId={viewMode && isWsAdmin ? selectedLocationId : undefined}
          onLocationChange={viewMode && isWsAdmin ? setSelectedLocationId : undefined}
          currentLocationName={viewMode && !isWsAdmin ? currentLocationName : undefined}
        />
      </div>
    </div>
    );
}