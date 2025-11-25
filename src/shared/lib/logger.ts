type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

class Logger {
  private isDevelopment: boolean;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    // Сохраняем в историю
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // В продакшене логируем только ошибки
    if (!this.isDevelopment && level !== "error") {
      return;
    }

    // Форматируем данные для вывода
    const formattedData = data ? { data } : {};
    const logMessage = `[${entry.timestamp}] [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case "debug":
        console.debug(logMessage, formattedData);
        break;
      case "info":
        console.log(logMessage, formattedData);
        break;
      case "warn":
        console.warn(logMessage, formattedData);
        break;
      case "error":
        console.error(logMessage, formattedData);
        break;
    }
  }

  debug(message: string, data?: unknown): void {
    this.log("debug", message, data);
  }

  info(message: string, data?: unknown): void {
    this.log("info", message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log("warn", message, data);
  }

  error(message: string, data?: unknown): void {
    this.log("error", message, data);
  }

  // Получить историю логов (для отладки)
  getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  // Очистить историю
  clearHistory(): void {
    this.logHistory = [];
  }
}

export const logger = new Logger();

