/**
 * The first-response SLA deadline (PRD 2.2): the one-business-day promise. Advances a timestamp by
 * whole business days, skipping Saturday and Sunday. Public holidays are out of scope for now.
 * Pure, so it is unit tested; weekend determination uses the server clock (Lagos in production).
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function businessDayDeadline(from: Date, businessDays = 1): Date {
  const deadline = new Date(from);
  let added = 0;
  while (added < businessDays) {
    deadline.setDate(deadline.getDate() + 1);
    if (!isWeekend(deadline)) added += 1;
  }
  return deadline;
}

/** Whether a New lead has breached its first-response SLA by now. */
export function isSlaBreached(createdAt: Date, now: Date = new Date()): boolean {
  return now > businessDayDeadline(createdAt, 1);
}
