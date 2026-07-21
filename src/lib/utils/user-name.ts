function words(name: string): readonly string[] {
  return name.trim().split(/\s+/).filter(Boolean);
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function toTitleCase(name: string): string {
  return words(name).map(capitalize).join(" ");
}

export function getInitials(name: string): string {
  const parts = words(name);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase();
}

export function getFirstName(name: string): string {
  const first = words(name)[0];
  return first ? capitalize(first) : "";
}
