// Maps known service-layer error messages to HTTP status codes so every controller
// stays consistent. Anything unrecognised falls back to 500.
export function statusForError(message: string): number {
  if (message.includes('requires a vendor account')) return 403;
  if (message.includes('Unauthenticated')) return 401;
  if (message === 'Invalid email or password') return 401;
  if (message.includes('Insufficient tokens') || message.includes('No active subscription')) return 402;
  if (message.includes('not found')) return 404;
  if (message.includes('already registered')) return 409;
  if (message.includes('is required')) return 400;
  if (message.includes('limit reached')) return 400;
  return 500;
}
