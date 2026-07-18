import { ClassValue } from "clsx"

export function formatFileSize(bytes: number, si = false, dp = 1) {
    const thresh = si ? 1000 : 1024

    if (Math.abs(bytes) < thresh) {
        return bytes + " B"
    }

    const units = si
        ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
        : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"]
    let u = -1
    const r = 10 ** dp

    do {
        bytes /= thresh
        ++u
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1)

    return bytes.toFixed(dp) + " " + units[u]
}

export function formatDatePtBr(date: Date): string {
    return new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
    })
        .format(date)
        .replace(".", "") // Remove dot after month abbreviation
        .replace("/", "/") // Ensure consistent spacing
}

export const cdnUrl = process.env.NEXT_PUBLIC_STATIC_URL || ""
// ClassValue

import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export const cn = (...inputs: ClassValue[]) => {
    return twMerge(clsx(inputs))
}

export const toTitleCase = (str: string) => {
    const firstLetter = str.charAt(0).toUpperCase()
    return firstLetter + str.slice(1).toLowerCase()
}
