// utils/DashLogger.ts
export class Dash {
  private stream: any; // The Hono stream object

  constructor(stream: any) {
    this.stream = stream;
  }

  // 1. The Basics
  async log(msg: string, level: "info" | "error" = "info") {
    await this.emit({
      type: "log",
      message: msg,
      level,
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  // 2. The Stats (The "Scoreboard")
  async stat(label: string, value: number | string, trend?: "up" | "down") {
    await this.emit({ type: "stat", label, value, trend });
  }

  // 3. The Structure (The "Layout")
  async pipeline(
    name: string,
    status: "idle" | "active" | "error",
    metric: string,
  ) {
    await this.emit({ type: "pipeline", name, status, metric });
  }

  // 4. The "Progress Bar" (Optional Deluxe Feature)
  async progress(label: string, percent: number) {
    await this.emit({ type: "progress", label, percent });
  }

  private async emit(data: any) {
    await this.stream.write(`${JSON.stringify(data)}\n`);
  }
}
