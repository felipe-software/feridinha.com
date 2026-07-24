export const getClipboardHttpUrl = (text: string): string | null => {
    const candidate = text.trim()
    if (!candidate || /\s/.test(candidate)) return null

    try {
        const url = new URL(candidate)
        return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null
    } catch {
        return null
    }
}

export const isEditablePasteTarget = (target: EventTarget | null): boolean => {
    if (!target) return false

    const element = target as HTMLElement
    const tagName = element.tagName?.toLowerCase()
    return tagName === "input" || tagName === "textarea" || Boolean(element.isContentEditable)
}
