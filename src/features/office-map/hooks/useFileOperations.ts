import type { OfficeMapData } from "../model/types";
import type { Room } from "../model/types";

interface UseFileOperationsParams {
  floors: Record<string, Room[]>;
  boundaryPoints: number[][];
  boundaryClosed: boolean;
  setFloors: React.Dispatch<React.SetStateAction<Record<string, Room[]>>>;
  setBoundaryPoints: React.Dispatch<React.SetStateAction<number[][]>>;
  setBoundaryClosed: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDrawingBoundary: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useFileOperations = ({
  floors,
  boundaryPoints,
  boundaryClosed,
  setFloors,
  setBoundaryPoints,
  setBoundaryClosed,
  setIsDrawingBoundary,
}: UseFileOperationsParams) => {
  const exportJSON = () => {
    const data: OfficeMapData = {
      floors,
      boundary: {
        points: boundaryPoints,
        closed: boundaryClosed,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "office_map.json";
    a.click();
  };

  const importJSON = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data: OfficeMapData = JSON.parse(reader.result as string);
        setFloors(data.floors || {});
        if (data.boundary) {
          setBoundaryPoints(data.boundary.points || []);
          setBoundaryClosed(!!data.boundary.closed);
          setIsDrawingBoundary(!(data.boundary && data.boundary.closed));
        }
      } catch {
        alert("Ошибка чтения JSON");
      }
    };
    reader.readAsText(file);
  };

  return {
    exportJSON,
    importJSON,
  };
};

