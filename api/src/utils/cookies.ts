export const readCookie = (cookieHeader: string | undefined, name: string) => {
    if (!cookieHeader) return undefined;

    for (const item of cookieHeader.split(";")) {
        const separator = item.indexOf("=");
        if (separator === -1) continue;
        const key = item.slice(0, separator).trim();
        if (key !== name) continue;

        try {
            return decodeURIComponent(item.slice(separator + 1).trim());
        } catch {
            return undefined;
        }
    }

    return undefined;
};
