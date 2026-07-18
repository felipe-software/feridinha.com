/**
 * Converte um nome em slug único.
 * Ex: "sala divertida" → "sala-divertida"
 */
export function toSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}
