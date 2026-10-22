import { format } from "date-fns";

export function formatTime(time) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function getTodayString(dateFormatStr = "yyyy-MM-dd") {
  return format(new Date(), dateFormatStr);
}
