"use client";

import React, { useState, useRef, useEffect } from "react";
import type { Room, Preset } from "../model/types";
import { DEFAULT_PRESETS, DEFAULT_FLOOR_NAME } from "../lib/constants";
import { useBoundaryDrawing } from "../hooks/useBoundaryDrawing";
import { useZoomPan } from "../hooks/useZoomPan";
import { useRoomInteraction } from "../hooks/useRoomInteraction";
import { usePresetDrag } from "../hooks/usePresetDrag";
import { useFileOperations } from "../hooks/useFileOperations";
import { useCustomPreset } from "../hooks/useCustomPreset";
import { clientToCanvasCoords } from "../lib/helpers";
import { LeftPanel } from "./panels/LeftPanel";
import { BottomPanel } from "./panels/BottomPanel";
import { OfficeCanvas } from "./canvas/OfficeCanvas";
import { ZoomControls } from "./controls/ZoomControls";
import { CustomPresetModal } from "./modals/CustomPresetModal";
import { workspaceAdminApi } from "@/entities/location";
import { bookingApi } from "@/entities/booking";
import { useAuthStore } from "@/features/auth";
import { showSuccessToast, showErrorToast } from "@/shared/lib/toast";
import type { SpaceType, SpacesByFloorResponse, SpaceItem } from "@/entities/booking";
import { isProjectAdmin, isWorkspaceAdmin } from "@/shared/lib/roles";
import { logger } from "@/shared/lib/logger";

interface Location {
  id: number;
  name: string;
  city?: string;
  isActive?: boolean;
}

interface OfficeConstructorProps {
  locationId?: number | null;
  editMode?: boolean; // Режим редактирования (по умолчанию true для админов)
  // Для выбора офисов (в режиме просмотра для админов)
  locations?: Location[];
  loadingLocations?: boolean;
  selectedLocationId?: number | null;
  onLocationChange?: (locationId: number | null) => void;
  currentLocationName?: string;
}

export const OfficeConstructor: React.FC<OfficeConstructorProps> = ({ 
  locationId: propLocationId,
  editMode: propEditMode,
  locations,
  loadingLocations = false,
  selectedLocationId,
  onLocationChange,
  currentLocationName,
}) => {
  const { accessToken, user } = useAuthStore();
  const isAdmin = isProjectAdmin(user) || isWorkspaceAdmin(user);
  const editMode = propEditMode !== undefined ? propEditMode : isAdmin; // По умолчанию редактирование для админов
  
  const [floors, setFloors] = useState<Record<string, Room[]>>({
    [DEFAULT_FLOOR_NAME]: [],
  });
  const [currentFloor, setCurrentFloor] = useState<string>(DEFAULT_FLOOR_NAME);
  const [presets, setPresets] = useState<Preset[]>(DEFAULT_PRESETS);
  const [spaceTypes, setSpaceTypes] = useState<SpaceType[]>([]);
  const [loadingSpaceTypes, setLoadingSpaceTypes] = useState(true);
  const [roomSpaceTypes, setRoomSpaceTypes] = useState<Record<string, number>>({}); // roomId -> spaceTypeId
  const [roomCapacities, setRoomCapacities] = useState<Record<string, number>>({}); // roomId -> capacity
  const [saving, setSaving] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);
  // Храним границы для каждого этажа отдельно
  const [floorBoundaries, setFloorBoundaries] = useState<Record<string, { points: number[][]; closed: boolean }>>({});
  // Храним загруженные этажи (номер этажа -> данные)
  const [, setLoadedFloorsData] = useState<Record<number, SpacesByFloorResponse>>({});

  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const boundaryDrawing = useBoundaryDrawing();
  const {
    isDrawingBoundary,
    boundaryPoints,
    boundaryClosed,
    addBoundaryPoint,
    closeBoundary,
    resetBoundary,
    forceCloseBoundary,
    setBoundaryPoints,
    setBoundaryClosed,
    setIsDrawingBoundary,
  } = boundaryDrawing;

  const { zoom, offset, handleWheel, startPan, handlePanMove, stopPan, zoomIn, zoomOut, resetView } =
    useZoomPan();

  const rooms = floors[currentFloor] || [];

  const roomInteraction = useRoomInteraction({
    svgRef,
    offset,
    zoom,
    rooms,
    currentFloor,
    setFloors,
    editMode,
  });

  const selectedRoom =
    rooms.find((r) => r.id === roomInteraction.selectedRoomId) || null;

  const { draggingPreset, draggingPresetPos, startDragPreset } = usePresetDrag({
    svgRef,
    offset,
    zoom,
    boundaryClosed,
    boundaryPoints,
    currentFloor,
    setFloors,
    wrapperRef,
    editMode,
  });

  const { exportJSON, importJSON } = useFileOperations({
    floors,
    boundaryPoints,
    boundaryClosed,
    setFloors,
    setBoundaryPoints,
    setBoundaryClosed,
    setIsDrawingBoundary: boundaryDrawing.setIsDrawingBoundary,
  });

  const customPreset = useCustomPreset(setPresets);

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!editMode) return; // В режиме просмотра не рисуем границы
    if (draggingPreset) return;
    if (e.button !== 0) return;

    const p = clientToCanvasCoords({
      clientX: e.clientX,
      clientY: e.clientY,
      svgElement: svgRef.current,
      offset,
      zoom,
    });
    addBoundaryPoint([p.x, p.y]);
  };

  const handleCanvasDblClick = () => {
    closeBoundary();
    // Сохраняем границы для текущего этажа после закрытия
    if (boundaryPoints.length >= 3) {
      setFloorBoundaries((prev) => ({
        ...prev,
        [currentFloor]: { points: boundaryPoints, closed: true },
      }));
    }
  };

  const handleMouseDownOnSvg = (e: React.MouseEvent) => {
    const me = e.nativeEvent as MouseEvent;
    startPan(me.clientX, me.clientY, me.button, e.shiftKey);
  };

  const handleMouseMoveOnWindow = (e: MouseEvent) => {
    handlePanMove(e.clientX, e.clientY);
  };

  const handleMouseUpOnWindow = () => {
    stopPan();
  };

  React.useEffect(() => {
    window.addEventListener("mousemove", handleMouseMoveOnWindow);
    window.addEventListener("mouseup", handleMouseUpOnWindow);
    return () => {
      window.removeEventListener("mousemove", handleMouseMoveOnWindow);
      window.removeEventListener("mouseup", handleMouseUpOnWindow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Загружаем границы этажа при переключении или обновлении floorBoundaries
  useEffect(() => {
    // Используем requestAnimationFrame для гарантии, что floorBoundaries обновлены
    requestAnimationFrame(() => {
      const floorBoundary = floorBoundaries[currentFloor];
      logger.debug("🔍 Проверка границ для этажа", {
        currentFloor,
        hasBoundary: !!floorBoundary,
        isClosed: floorBoundary?.closed,
        pointsCount: floorBoundary?.points?.length || 0,
        allFloors: Object.keys(floorBoundaries),
        floorBoundariesKeys: Object.keys(floorBoundaries),
        floorBoundaryData: floorBoundary,
      });
      
      if (floorBoundary && floorBoundary.closed && floorBoundary.points && floorBoundary.points.length > 0) {
        // Убеждаемся, что points это массив массивов чисел
        const validPoints = floorBoundary.points.filter(
          (p) => Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number'
        );
        
        if (validPoints.length > 0) {
          setBoundaryPoints(validPoints);
          setBoundaryClosed(true);
          setIsDrawingBoundary(false);
          logger.debug("✅ Применены границы этажа", { 
            floor: currentFloor, 
            pointsCount: validPoints.length,
            firstPoint: validPoints[0],
            lastPoint: validPoints[validPoints.length - 1],
            allPoints: validPoints,
          });
        } else {
          logger.debug("❌ Невалидные точки границ", { 
            floor: currentFloor,
            points: floorBoundary.points,
          });
          setBoundaryPoints([]);
          setBoundaryClosed(false);
          setIsDrawingBoundary(editMode);
        }
      } else {
        setBoundaryPoints([]);
        setBoundaryClosed(false);
        setIsDrawingBoundary(editMode); // В режиме просмотра не включаем режим рисования
        logger.debug("❌ Границы этажа не найдены или пусты", { 
          floor: currentFloor,
          floorBoundary,
          availableFloors: Object.keys(floorBoundaries),
          floorBoundariesData: floorBoundaries,
        });
      }
    });
  }, [currentFloor, floorBoundaries, setBoundaryPoints, setBoundaryClosed, setIsDrawingBoundary, editMode]);

  // Загружаем типы пространств при монтировании
  useEffect(() => {
    if (!propLocationId || !accessToken) return;
    (async () => {
      setLoadingSpaceTypes(true);
      try {
        const res = await bookingApi.getSpaceTypes(propLocationId, accessToken);
        if (res.data) {
          setSpaceTypes(res.data);
          if (res.data.length === 0) {
            showErrorToast(
              "Типы пространств не найдены. Создайте хотя бы один тип пространства в разделе 'Типы пространств'.",
              "Внимание"
            );
          }
        } else if (res.error) {
          showErrorToast(
            `Ошибка загрузки типов пространств: ${res.error.message}`,
            "Ошибка"
          );
        }
      } catch {
        showErrorToast(
          "Не удалось загрузить типы пространств. Проверьте подключение к серверу.",
          "Ошибка"
        );
      } finally {
        setLoadingSpaceTypes(false);
      }
    })();
  }, [propLocationId, accessToken]);

  // Обновляем propLocationId при изменении selectedLocationId (для админов)
  useEffect(() => {
    if (onLocationChange && selectedLocationId !== undefined) {
      // selectedLocationId управляется извне через onLocationChange
      // propLocationId будет обновлён родительским компонентом
    }
  }, [selectedLocationId, onLocationChange]);

  // Загружаем сохраненные пространства при монтировании
  useEffect(() => {
    if (!propLocationId || !accessToken) return;
    
    // Восстанавливаем состояние из localStorage (только в режиме редактирования)
    // НО НЕ устанавливаем floors здесь, чтобы избежать дублирования при загрузке с сервера
    // floors будут установлены только один раз - либо из localStorage, либо с сервера
    if (editMode) {
      const savedState = localStorage.getItem(`office_map_${propLocationId}`);
      if (savedState) {
        try {
          const data = JSON.parse(savedState);
          // Очищаем дубликаты перед восстановлением
          if (data.floors) {
            const cleanedFloors: Record<string, Room[]> = {};
            Object.entries(data.floors).forEach(([floorName, rooms]: [string, any]) => {
              const seenRoomIds = new Set<string>();
              cleanedFloors[floorName] = (rooms as Room[]).filter((room) => {
                if (seenRoomIds.has(room.id)) {
                  logger.debug(`Удалён дубликат при восстановлении из localStorage: ${room.id} на этаже ${floorName}`);
                  return false;
                }
                seenRoomIds.add(room.id);
                return true;
              });
            });
            // Устанавливаем floors только если они есть и очищены от дубликатов
            setFloors(cleanedFloors);
            if (Object.keys(cleanedFloors).length > 0) {
              const firstFloor = Object.keys(cleanedFloors)[0];
              setCurrentFloor(firstFloor);
              logger.debug("Установлен текущий этаж из localStorage", { 
                floor: firstFloor,
                roomsCount: cleanedFloors[firstFloor]?.length || 0,
              });
            }
          }
          if (data.floorBoundaries) {
            setFloorBoundaries(data.floorBoundaries);
            logger.debug("Восстановлены границы из localStorage", { 
              boundariesCount: Object.keys(data.floorBoundaries).length 
            });
          }
          if (data.roomSpaceTypes) {
            setRoomSpaceTypes(data.roomSpaceTypes);
          }
          if (data.roomCapacities) {
            setRoomCapacities(data.roomCapacities);
          }
          logger.debug("Восстановлено состояние из localStorage", { locationId: propLocationId });
        } catch (error) {
          logger.error("Ошибка восстановления состояния из localStorage", error);
        }
      }
    }

    // Загружаем сохраненные данные с сервера
    (async () => {
      setLoadingFloors(true);
      try {
        // Пробуем загрузить этажи 1-10 (можно оптимизировать, если будет API для получения списка этажей)
        const floorPromises: Promise<void>[] = [];
        const loadedData: Record<number, SpacesByFloorResponse> = {};
        
        for (let floorNumber = 1; floorNumber <= 10; floorNumber++) {
          floorPromises.push(
            bookingApi.getSpacesByLocationAndFloor(propLocationId, floorNumber, accessToken)
              .then((res) => {
                // Загружаем данные, если есть polygon (границы) или spaces
                if (res.data && (res.data.floor?.polygon?.length > 0 || res.data.spaces?.length > 0)) {
                  loadedData[floorNumber] = res.data;
                  logger.debug(`Загружен этаж ${floorNumber}`, {
                    hasPolygon: !!res.data.floor?.polygon?.length,
                    polygonLength: res.data.floor?.polygon?.length || 0,
                    spacesCount: res.data.spaces?.length || 0,
                  });
                }
              })
              .catch(() => {
                // Игнорируем ошибки для несуществующих этажей
                logger.debug(`Этаж ${floorNumber} не найден или пуст`);
              })
          );
        }

        await Promise.all(floorPromises);
        setLoadedFloorsData(loadedData);

        // Преобразуем загруженные данные в формат редактора
        const newFloors: Record<string, Room[]> = {};
        const newFloorBoundaries: Record<string, { points: number[][]; closed: boolean }> = {};
        const newRoomSpaceTypes: Record<string, number> = {};
        const newRoomCapacities: Record<string, number> = {};

        Object.entries(loadedData).forEach(([floorNumStr, floorData]) => {
          const floorNumber = Number(floorNumStr);
          const floorName = `${floorNumber} этаж`;
          
          // Преобразуем polygon в формат boundaryPoints
          if (floorData.floor?.polygon && floorData.floor.polygon.length > 0) {
            const polygonPoints = floorData.floor.polygon.map((p) => [p.x, p.y]);
            newFloorBoundaries[floorName] = {
              points: polygonPoints,
              closed: true,
            };
            logger.debug(`✅ Созданы границы для ${floorName}`, {
              pointsCount: polygonPoints.length,
              firstPoint: polygonPoints[0],
              lastPoint: polygonPoints[polygonPoints.length - 1],
              allPoints: polygonPoints,
              rawPolygon: floorData.floor.polygon,
            });
          } else {
            logger.debug(`❌ Нет границ для ${floorName}`, {
              hasFloor: !!floorData.floor,
              hasPolygon: !!floorData.floor?.polygon,
              polygonLength: floorData.floor?.polygon?.length || 0,
            });
          }

          // Преобразуем spaces в rooms
          if (floorData.spaces && floorData.spaces.length > 0) {
            // Убираем возможные дубликаты spaces по id,
            // чтобы список помещений не раздувался
            const seenSpaceIds = new Set<number>();
            const seenRoomIds = new Set<string>();
            const rooms: Room[] = [];

            floorData.spaces.forEach((space: SpaceItem) => {
              // Проверяем дубликаты по space.id
              if (seenSpaceIds.has(space.id)) {
                logger.debug(`Пропущен дубликат space.id=${space.id}`);
                return;
              }
              seenSpaceIds.add(space.id);

              const roomId = `space_${space.id}`;
              
              // Дополнительная проверка по roomId на случай, если roomId совпадает
              if (seenRoomIds.has(roomId)) {
                logger.debug(`Пропущен дубликат roomId=${roomId}`);
                return;
              }
              seenRoomIds.add(roomId);

              const bounds = space.bounds;
              
              // Сохраняем spaceTypeId и capacity
              newRoomSpaceTypes[roomId] = space.spaceTypeId;
              newRoomCapacities[roomId] = space.capacity;

              rooms.push({
                id: roomId,
                name: `${space.spaceType} (${space.capacity} мест)`,
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height,
              });
            });

            // Заменяем полностью, а не добавляем к существующим
            newFloors[floorName] = rooms;
            logger.debug(`Загружено ${rooms.length} помещений для ${floorName}`, {
              spaceIds: Array.from(seenSpaceIds),
              roomIds: Array.from(seenRoomIds),
            });
          } else {
            // Создаем пустой этаж, если есть только границы
            newFloors[floorName] = [];
          }
        });

        // Объединяем с восстановленными данными из localStorage (приоритет у localStorage в режиме редактирования)
        if (editMode) {
          const savedState = localStorage.getItem(`office_map_${propLocationId}`);
          if (savedState) {
            // В режиме редактирования используем данные из localStorage, если они есть
            // НЕ загружаем floors с сервера, чтобы избежать дублирования
            logger.debug("Используем данные из localStorage в режиме редактирования, пропускаем загрузку с сервера");
            const savedData = JSON.parse(savedState);
            
            // Но обновляем floorBoundaries из сервера, если их нет в localStorage
            if (!savedData.floorBoundaries || Object.keys(savedData.floorBoundaries).length === 0) {
              if (Object.keys(newFloorBoundaries).length > 0) {
                setFloorBoundaries(newFloorBoundaries);
                logger.debug("Обновлены границы из сервера (не было в localStorage)");
              }
            }
          } else {
            // Если нет сохраненных данных, используем данные с сервера
            if (Object.keys(newFloors).length > 0) {
              const firstFloor = Object.keys(newFloors)[0];
              // Устанавливаем floors только один раз
              setFloors(newFloors);
              
              // Сначала устанавливаем границы, потом этаж, чтобы useEffect сработал правильно
              if (Object.keys(newFloorBoundaries).length > 0) {
                logger.debug("🔧 Устанавливаем границы из сервера", { 
                  boundariesCount: Object.keys(newFloorBoundaries).length,
                  boundaries: Object.keys(newFloorBoundaries),
                  firstFloor,
                  boundariesData: newFloorBoundaries,
                });
                setFloorBoundaries(newFloorBoundaries);
                // Используем двойной requestAnimationFrame для гарантии применения границ
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    setCurrentFloor(firstFloor);
                    logger.debug("✅ Установлен текущий этаж после загрузки границ", { 
                      floor: firstFloor,
                      boundariesForFloor: newFloorBoundaries[firstFloor],
                    });
                  });
                });
              } else {
                logger.debug("⚠️ Нет границ для установки", { firstFloor });
                setCurrentFloor(firstFloor);
              }
            }
            setRoomSpaceTypes(newRoomSpaceTypes);
            setRoomCapacities(newRoomCapacities);
          }
        } else {
          // В режиме просмотра всегда используем данные с сервера (БЕЗ localStorage)
          if (Object.keys(newFloors).length > 0) {
            const firstFloor = Object.keys(newFloors)[0];
            // Устанавливаем floors только один раз
            setFloors(newFloors);
            
            // Сначала устанавливаем границы, потом этаж, чтобы useEffect сработал правильно
            if (Object.keys(newFloorBoundaries).length > 0) {
              logger.debug("🔧 Устанавливаем границы из сервера (режим просмотра)", { 
                boundariesCount: Object.keys(newFloorBoundaries).length,
                boundaries: Object.keys(newFloorBoundaries),
                firstFloor,
                boundariesData: newFloorBoundaries,
              });
              setFloorBoundaries(newFloorBoundaries);
              // Используем двойной requestAnimationFrame для гарантии применения границ
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  setCurrentFloor(firstFloor);
                  logger.debug("✅ Установлен текущий этаж после загрузки границ (режим просмотра)", { 
                    floor: firstFloor,
                    boundariesForFloor: newFloorBoundaries[firstFloor],
                  });
                });
              });
            } else {
              logger.debug("⚠️ Нет границ для установки (режим просмотра)", { firstFloor });
              setCurrentFloor(firstFloor);
            }
          }
          
          setRoomSpaceTypes(newRoomSpaceTypes);
          setRoomCapacities(newRoomCapacities);
        }

        logger.debug("Загружены данные с сервера", { 
          floorsCount: Object.keys(newFloors).length,
          locationId: propLocationId 
        });
      } catch (error) {
        logger.error("Ошибка загрузки пространств с сервера", error);
        showErrorToast(
          "Не удалось загрузить сохраненные пространства. Проверьте подключение к серверу.",
          "Ошибка"
        );
      } finally {
        setLoadingFloors(false);
      }
    })();
  }, [propLocationId, accessToken, editMode]);

  const handleAddFloor = () => {
    const name = prompt("Название нового этажа:");
    if (!name) return;
    if (floors[name]) {
      alert("Этаж существует");
      return;
    }
    setFloors((prev) => ({ ...prev, [name]: [] }));
    setCurrentFloor(name);
  };

  // Функция для сохранения пространств на сервер
  const handleSaveSpaces = async () => {
    if (!propLocationId || !accessToken) {
      showErrorToast("Не указан ID локации или отсутствует токен авторизации", "Ошибка");
      return;
    }

    if (loadingSpaceTypes) {
      showErrorToast("Загрузка типов пространств... Пожалуйста, подождите.", "Ожидание");
      return;
    }

    if (spaceTypes.length === 0) {
      showErrorToast(
        "Типы пространств не найдены. Перейдите в раздел 'Типы пространств' и создайте хотя бы один тип перед сохранением карты.",
        "Требуется действие"
      );
      return;
    }

    setSaving(true);
    try {
      // Преобразуем этажи в формат для API
      const floorEntries = Object.entries(floors);
      
      for (const [floorName, rooms] of floorEntries) {
        if (rooms.length === 0) continue;

        // Парсим номер этажа из названия (например, "1 этаж" -> 1)
        const floorNumberMatch = floorName.match(/\d+/);
        const floorNumber = floorNumberMatch ? Number(floorNumberMatch[0]) : 1;

        // Получаем полигон этажа из сохраненных границ или текущих boundaryPoints
        const floorBoundary = floorBoundaries[floorName] || (boundaryClosed && boundaryPoints.length > 0 
          ? { points: boundaryPoints, closed: true }
          : null);
        
        // Преобразуем массив массивов [[x, y], ...] в массив объектов [{x, y}, ...]
        const polygonPoints = floorBoundary?.points || [];
        const polygon = polygonPoints.map(([x, y]) => ({ x, y }));

        // Если полигон пуст, предупреждаем пользователя
        if (polygon.length === 0) {
          showErrorToast(
            `Для этажа "${floorName}" необходимо нарисовать границы (полигон). Закройте границы двойным кликом перед сохранением.`,
            "Требуется действие"
          );
          setSaving(false);
          return;
        }

        // Преобразуем комнаты в формат для API
        const spaces = rooms.map((room) => {
          const spaceTypeId = roomSpaceTypes[room.id] || spaceTypes[0]?.id;
          const capacity = roomCapacities[room.id] || 1;

          return {
            spaceTypeId: spaceTypeId || 1,
            capacity,
            locationId: propLocationId, // Добавляем locationId в каждый элемент
            floorNumber, // Добавляем floorNumber в каждый элемент
            x: room.x,
            y: room.y,
            width: room.width,
            height: room.height,
          };
        });

        if (spaces.length > 0) {
          const res = await workspaceAdminApi.createFloorSpaces(
            {
              locationId: propLocationId,
              floorNumber,
              polygon, // Добавляем полигон этажа
              spaces,
            },
            accessToken
          );

          if (res.error) {
            showErrorToast(
              `Ошибка сохранения этажа "${floorName}": ${res.error.message}`,
              "Ошибка"
            );
            setSaving(false);
            return;
          }
        }
      }

      showSuccessToast(
        `Пространства успешно сохранены для локации ${propLocationId}`,
        "Успешно"
      );

      // Сохраняем состояние в localStorage после успешного сохранения
      if (propLocationId) {
        const stateToSave = {
          floors,
          floorBoundaries,
          roomSpaceTypes,
          roomCapacities,
          currentFloor,
        };
        localStorage.setItem(`office_map_${propLocationId}`, JSON.stringify(stateToSave));
        logger.debug("Состояние сохранено в localStorage", { locationId: propLocationId });
      }
    } catch (err) {
      showErrorToast(
        err instanceof Error ? err.message : "Неизвестная ошибка",
        "Ошибка"
      );
    } finally {
      setSaving(false);
    }
  };

  // Сохраняем состояние в localStorage при изменениях (debounced)
  useEffect(() => {
    if (!propLocationId || !editMode) return;
    
    const timeoutId = setTimeout(() => {
      const stateToSave = {
        floors,
        floorBoundaries,
        roomSpaceTypes,
        roomCapacities,
        currentFloor,
      };
      localStorage.setItem(`office_map_${propLocationId}`, JSON.stringify(stateToSave));
    }, 1000); // Сохраняем через 1 секунду после последнего изменения

    return () => clearTimeout(timeoutId);
  }, [floors, floorBoundaries, roomSpaceTypes, roomCapacities, currentFloor, propLocationId, editMode]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Левая панель - компактная и стильная */}
      <LeftPanel
        floors={floors}
        currentFloor={currentFloor}
        onFloorSelect={setCurrentFloor}
        onAddFloor={handleAddFloor}
        onResetBoundary={resetBoundary}
        onForceCloseBoundary={forceCloseBoundary}
        onExport={exportJSON}
        onImport={importJSON}
        onSaveSpaces={editMode ? handleSaveSpaces : undefined}
        saving={saving}
        locationId={propLocationId || null}
        spaceTypesCount={spaceTypes.length}
        loadingSpaceTypes={loadingSpaceTypes}
        editMode={editMode}
        locations={locations}
        loadingLocations={loadingLocations}
        selectedLocationId={selectedLocationId}
        onLocationChange={onLocationChange}
        currentLocationName={currentLocationName}
      />

      {/* Центральная область - карта на весь экран */}
      <main className="flex-1 flex flex-col relative">
        {/* Карта на весь экран */}
        <div className="flex-1 relative">
          <OfficeCanvas
            rooms={rooms}
            boundaryPoints={boundaryPoints}
            boundaryClosed={boundaryClosed}
            isDrawingBoundary={isDrawingBoundary}
            zoom={zoom}
            offset={offset}
            selectedRoomId={roomInteraction.selectedRoomId}
            selectedRoom={selectedRoom}
            roomSpaceTypes={roomSpaceTypes}
            roomCapacities={roomCapacities}
            onCloseRoomInfo={() => roomInteraction.setSelectedRoomId(null)}
            draggingPreset={draggingPreset}
            draggingPresetPos={draggingPresetPos}
            onCanvasClick={handleCanvasClick}
            onCanvasDblClick={handleCanvasDblClick}
            onCanvasMouseDown={handleMouseDownOnSvg}
            onWheel={(e) => handleWheel(e, svgRef)}
            onRoomMouseDown={roomInteraction.startMoveRoom}
            onRoomResizeMouseDown={roomInteraction.startResize}
            onRoomMove={roomInteraction.onMoveDrag}
            onRoomResize={roomInteraction.onResizeMove}
            onRoomMoveEnd={roomInteraction.endMove}
            onRoomResizeEnd={roomInteraction.endResize}
            isMovingRoom={roomInteraction.isMovingRoom}
            isResizing={roomInteraction.isResizing}
            wrapperRef={wrapperRef}
            svgRef={svgRef}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onResetView={resetView}
            editMode={editMode}
          />
        </div>
      </main>

      {/* Правая панель - пресеты и список комнат */}
      <aside className="w-80 bg-white border-l border-gray-200">
        <BottomPanel
          presets={presets}
          rooms={rooms}
          selectedRoomId={roomInteraction.selectedRoomId}
          onPresetDragStart={startDragPreset}
          onAddCustomPreset={customPreset.openModal}
          onSelectRoom={roomInteraction.setSelectedRoomId}
          onRenameRoom={roomInteraction.renameRoom}
          onDeleteRoom={roomInteraction.deleteRoom}
          spaceTypes={spaceTypes}
          roomSpaceTypes={roomSpaceTypes}
          roomCapacities={roomCapacities}
          onSpaceTypeChange={(roomId, spaceTypeId) => {
            setRoomSpaceTypes((prev) => ({ ...prev, [roomId]: spaceTypeId }));
          }}
          onCapacityChange={(roomId, capacity) => {
            setRoomCapacities((prev) => ({ ...prev, [roomId]: capacity }));
          }}
          editMode={editMode}
        />
      </aside>

      <CustomPresetModal
        isOpen={customPreset.isModalOpen}
        modalPolyPoints={customPreset.modalPolyPoints}
        modalSvgRef={customPreset.modalSvgRef}
        onModalClick={customPreset.handleModalClick}
        onClear={customPreset.clearModalPoints}
        onCancel={customPreset.closeModal}
        onSave={customPreset.addPreset}
      />
    </div>
  );
};

