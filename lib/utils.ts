type ClassDictionary = Record<string, boolean | null | undefined>;
type ClassArray = ClassValue[];

export type ClassValue =
  | string
  | number
  | null
  | undefined
  | ClassDictionary
  | ClassArray;

function appendClass(value: ClassValue, classList: string[]) {
  if (!value) {
    return;
  }

  if (typeof value === "string" || typeof value === "number") {
    classList.push(String(value));
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => appendClass(entry, classList));
    return;
  }

  Object.entries(value).forEach(([key, condition]) => {
    if (condition) {
      classList.push(key);
    }
  });
}

export function cn(...inputs: ClassValue[]) {
  const classList: string[] = [];
  inputs.forEach((value) => appendClass(value, classList));
  return classList.join(" ");
}
