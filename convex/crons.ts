import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Pending requests older than settings.holdHours (default 48h) expire to „otkazan" / „истекло".
crons.interval("expire pending booking requests", { hours: 1 }, internal.bookings.expirePending, {});

export default crons;
