/**
 * Reusable inline field validation components.
 *
 * Usage:
 *   <Input className={fieldErrorClass(errors.myField)} />
 *   <FieldError message={errors.myField} />
 */

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-red-500 mt-0.5">{message}</p>
  );
}

export const fieldErrorClass = (error?: string) =>
  error ? "border-red-500 focus-visible:ring-red-500" : "";
