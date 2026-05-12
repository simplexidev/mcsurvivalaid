export type ModalFieldValue = string | number | boolean;

export function getNumberField(values: ModalFieldValue[] | undefined, index: number, fallback = 0): number {
  if (!values || index < 0 || index >= values.length) return fallback;
  const value = Number(values[index]);
  return Number.isFinite(value) ? value : fallback;
}

export function getBooleanField(values: ModalFieldValue[] | undefined, index: number, fallback = false): boolean {
  if (!values || index < 0 || index >= values.length) return fallback;
  const value = values[index];
  return typeof value === "boolean" ? value : fallback;
}
