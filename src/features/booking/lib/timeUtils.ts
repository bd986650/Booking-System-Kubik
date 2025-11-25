/**
 * Форматирует время с учетом offset для отображения в нужном часовом поясе
 * @param isoString - ISO строка времени (может содержать offset)
 * @param offset - смещение времени (например, "+03:00")
 * @returns отформатированное время в формате МСК
 */
export function formatTimeWithOffset(isoString: string, offset?: string): string {
  let date: Date;
  
  // Если ISO строка уже содержит offset (например, "2025-11-25T06:00:00+03:00"),
  // Date правильно его обработает
  if (isoString.includes("+") || isoString.includes("Z") || isoString.match(/[+-]\d{2}:\d{2}$/)) {
    date = new Date(isoString);
  } 
  // Если ISO строка не содержит offset, но offset указан отдельно,
  // это означает, что время в UTC, и offset показывает целевой часовой пояс
  else if (offset) {
    // Парсим offset (например, "+03:00" -> +3 часа)
    const offsetMatch = offset.match(/^([+-])(\d{2}):(\d{2})$/);
    if (offsetMatch) {
      const sign = offsetMatch[1] === "+" ? 1 : -1;
      const hours = parseInt(offsetMatch[2], 10);
      const minutes = parseInt(offsetMatch[3], 10);
      const offsetMs = sign * (hours * 60 + minutes) * 60 * 1000;
      
      // Парсим время как UTC (добавляем Z)
      const utcDate = new Date(isoString.endsWith("Z") ? isoString : isoString + "Z");
      
      // Применяем offset: если offset "+03:00", значит UTC время нужно показать как МСК
      // То есть добавляем 3 часа к UTC времени
      date = new Date(utcDate.getTime() + offsetMs);
    } else {
      // Если offset в неверном формате, парсим как есть
      date = new Date(isoString);
    }
  } 
  // Если offset не указан, парсим как есть
  else {
    date = new Date(isoString);
  }
  
  // Форматируем в МСК
  return date.toLocaleTimeString("ru-RU", { 
    hour: "2-digit", 
    minute: "2-digit",
    timeZone: "Europe/Moscow"
  });
}

