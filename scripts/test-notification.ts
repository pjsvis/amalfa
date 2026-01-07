#!/usr/bin/env bun
import { sendNotification } from "../src/utils/Notifications";

console.log("🔔 Sending test notification...");
try {
    await sendNotification("AMALFA Daemon", "Knowledge graph updated successfully!");
    console.log("✅ Notification sent - Check your notification center in the top-right");
} catch (e) {
    console.error("❌ Notification failed:", e);
}
