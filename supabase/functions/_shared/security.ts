export function hasBearerAuthorization(request: Request): boolean {
  return /^Bearer\s+\S+$/i.test(request.headers.get("Authorization") ?? "");
}

export function isCronAuthorized(provided: string | null, configured: string | undefined): boolean {
  return Boolean(configured && provided && provided === configured);
}

export function shouldRollbackReminderReservation(deliveredCount: number): boolean {
  return deliveredCount === 0;
}
