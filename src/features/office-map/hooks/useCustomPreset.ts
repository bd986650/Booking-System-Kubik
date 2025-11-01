import { useState, useRef } from "react";
import type { Preset } from "../model/types";
import { genId } from "../lib/helpers";

export const useCustomPreset = (setPresets: React.Dispatch<React.SetStateAction<Preset[]>>) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPolyPoints, setModalPolyPoints] = useState<number[][]>([]);
  const modalSvgRef = useRef<SVGSVGElement | null>(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setModalPolyPoints([]);
  };

  const handleModalClick = (e: React.MouseEvent) => {
    const svg = modalSvgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setModalPolyPoints((p) => [...p, [x, y]]);
  };

  const clearModalPoints = () => setModalPolyPoints([]);

  const addPreset = () => {
    if (modalPolyPoints.length < 3) {
      alert("Нарисуйте полигона с минимум 3 точками.");
      return;
    }
    const id = genId("p_");
    setPresets((p) => [
      ...p,
      { id, name: `Кастом ${p.length + 1}`, type: "poly", poly: modalPolyPoints },
    ]);
    setModalPolyPoints([]);
    setIsModalOpen(false);
  };

  return {
    isModalOpen,
    modalPolyPoints,
    modalSvgRef,
    openModal,
    closeModal,
    handleModalClick,
    clearModalPoints,
    addPreset,
  };
};

