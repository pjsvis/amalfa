import { spawn } from "node:child_process";
import { platform } from "node:os";

/**
 * Send a native desktop notification
 * Works on macOS (osascript) and Linux (notify-send)
 */
export async function sendNotification(
  title: string,
  message: string,
): Promise<void> {
  const os = platform();

  try {
    if (os === "darwin") {
      // macOS: Use osascript
      const script = `display notification "${escapeForAppleScript(message)}" with title "${escapeForAppleScript(title)}"`;
      await execCommand("osascript", ["-e", script]);
    } else if (os === "linux") {
      // Linux: Use notify-send (requires libnotify)
      await execCommand("notify-send", [title, message]);
    } else {
      // Windows/other: Not supported yet
      // Could add Windows toast notifications via PowerShell if needed
    }
  } catch (_e) {
    // Silently fail - notifications are non-critical
    // Could log to debug if needed
  }
}

/**
 * Escape strings for AppleScript
 */
function escapeForAppleScript(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Execute a command and wait for completion
 */
function execCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: "ignore",
      detached: false,
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command exited with code ${code}`));
      }
    });

    proc.on("error", reject);

    // Timeout after 5 seconds
    setTimeout(() => {
      proc.kill();
      reject(new Error("Notification timeout"));
    }, 5000);
  });
}
