import type { TimeIntervalItem } from "@/entities/booking";

/**
 * Преобразует ISO 8601 Duration (PT30M, PT1H) в миллисекунды
 */
function parseDurationToMs(duration: string): number {
  // Формат: PT30M, PT1H, PT2H и т.д.
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
  if (!match) {
    throw new Error(`Неверный формат длительности: ${duration}`);
  }

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);

  return (hours * 60 + minutes) * 60 * 1000; // в миллисекундах
}

/**
 * Разбивает большой интервал на мелкие интервалы с учетом доступных длительностей
 * @param interval - исходный интервал
 * @returns массив разбитых интервалов
 */
export function splitIntervalByDurations(interval: TimeIntervalItem): TimeIntervalItem[] {
  // Если интервал недоступен, возвращаем как есть
  const isAvailable = 
    interval.status === "available" || 
    (interval.available === true && interval.status !== "unavailable");
  
  if (!isAvailable) {
    return [interval];
  }

  // Если нет доступных длительностей, возвращаем как есть
  if (!interval.availableDurations || interval.availableDurations.length === 0) {
    return [interval];
  }

  // Парсим время как UTC.
  // Сервер отдает время в UTC без "Z" (например, "2025-11-27T06:00:00"),
  // поэтому добавляем "Z", чтобы избежать интерпретации как локального времени браузера.
  const toUtcMs = (value: string): number => {
    const hasZone = /[+-]\d{2}:\d{2}$/.test(value) || value.endsWith("Z");
    const utcString = hasZone ? value : `${value}Z`;
    return new Date(utcString).getTime();
  };

  const startTime = toUtcMs(interval.start);
  const endTime = toUtcMs(interval.end);
  const offset = interval.offset || "+03:00"; // По умолчанию МСК
  const result: TimeIntervalItem[] = [];

  // Для каждой доступной длительности создаем интервалы
  for (const duration of interval.availableDurations) {
    try {
      const durationMs = parseDurationToMs(duration);
      let currentStart = startTime;

      while (currentStart + durationMs <= endTime) {
        const currentEnd = currentStart + durationMs;
        
        // Сохраняем offset для правильного отображения времени
        // Время уже правильно обработано через Date, просто сохраняем offset
        const startISO = new Date(currentStart).toISOString();
        const endISO = new Date(currentEnd).toISOString();
        
        result.push({
          ...interval,
          start: startISO,
          end: endISO,
          offset: offset, // Сохраняем offset для правильного отображения
          available: true,
          status: "available",
          availableDurations: [duration], // Каждый подынтервал имеет свою длительность
        });

        currentStart = currentEnd;
      }
    } catch (error) {
      console.error(`Ошибка парсинга длительности ${duration}:`, error);
      // Если не удалось распарсить, пропускаем эту длительность
    }
  }

  // Если не удалось создать ни одного интервала, возвращаем исходный
  if (result.length === 0) {
    return [interval];
  }

  // Сортируем по времени начала
  return result.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Обрабатывает массив интервалов, разбивая большие интервалы на мелкие
 * @param intervals - массив интервалов от сервера
 * @returns обработанный массив интервалов
 */
export function processIntervals(intervals: TimeIntervalItem[]): TimeIntervalItem[] {
  const result: TimeIntervalItem[] = [];

  for (const interval of intervals) {
    const split = splitIntervalByDurations(interval);
    result.push(...split);
  }

  // Удаляем дубликаты (интервалы с одинаковым start и end)
  const unique = new Map<string, TimeIntervalItem>();
  for (const interval of result) {
    const key = `${interval.start}_${interval.end}`;
    if (!unique.has(key)) {
      unique.set(key, interval);
    }
  }

  // Сортируем по времени начала
  return Array.from(unique.values()).sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
}

