/**
 * Форматирует время с учетом offset.
 *
 * Сервер отдает время в UTC (например, "2025-11-27T06:00:00") и отдельное поле offset
 * (например, "+03:00" для МСК). Нам нужно отобразить локальное время: UTC + offset.
 *
 * Функция не зависит от часового пояса браузера и всегда возвращает строку "HH:MM".
 */
export function formatTimeWithOffset(isoString: string, offset?: string): string {
  // Приводим входную строку к UTC‑времени.
  // Если нет ни "Z", ни смещения в конце, считаем, что это "чистый" UTC и добавляем "Z".
  const hasZone = /[+-]\d{2}:\d{2}$/.test(isoString) || isoString.endsWith("Z");
  const utcString = hasZone ? isoString : `${isoString}Z`;

  let timeMs = new Date(utcString).getTime();

  // Если есть offset, прибавляем его к UTC
  if (offset) {
    const match = offset.match(/^([+-])(\d{2}):(\d{2})$/);
    if (match) {
      const sign = match[1] === "+" ? 1 : -1;
      const hours = parseInt(match[2], 10);
      const minutes = parseInt(match[3], 10);
      const offsetMs = sign * (hours * 60 + minutes) * 60 * 1000;
      timeMs += offsetMs;
    }
  }

  const shifted = new Date(timeMs);
  // Берем часы/минуты в UTC из уже сдвинутого времени — так избегаем влияния часового пояса ОС
  const hh = shifted.getUTCHours().toString().padStart(2, "0");
  const mm = shifted.getUTCMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

