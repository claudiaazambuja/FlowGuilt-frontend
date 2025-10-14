type ClassDictionary = Record<string, boolean | null | undefined>;
type ClassValue =
  | string
  | number
  | ClassDictionary
  | ClassValue[]
  | boolean
  | null
  | undefined;

function toClassName(value: ClassValue): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(toClassName).filter(Boolean).join(" ");
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter(([, condition]) => Boolean(condition))
      .map(([className]) => className)
      .join(" ");
  }

  return "";
}

export function cn(...inputs: ClassValue[]) {
  return inputs.map(toClassName).filter(Boolean).join(" ");
}
