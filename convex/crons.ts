import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
	"notifications-daily",
	{ hourUTC: 13, minuteUTC: 0 },
	internal.notifications.processDaily,
);

export default crons;
