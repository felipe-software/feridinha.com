import { writeFile } from "node:fs/promises"

const icons = new Set([
    "api",
    "arrow_drop_down",
    "attach_money",
    "auto_awesome",
    "check_circle",
    "close",
    "code",
    "contacts",
    "content_paste",
    "create_new_folder",
    "data_object",
    "delete",
    "delete_history",
    "dns",
    "edit",
    "electric_bolt",
    "error",
    "folder",
    "folder_open",
    "folderreviews",
    "gavel",
    "grid_view",
    "history_edu",
    "info",
    "menu",
    "paid",
    "person_add",
    "person_raised_hand",
    "psychology_alt",
    "question_mark",
    "reviews",
    "send",
    "shield_person",
    "smart_toy",
    "table",
    "tune",
    "upload_file",
    "verified_user",
    "visibility",
    "visibility_off",
])

const iconNames = [...icons].sort().join(",")

if (!process.argv.includes("--write")) {
    console.log(iconNames)
} else {
    const stylesheetUrl = new URL("https://fonts.googleapis.com/css2")
    stylesheetUrl.searchParams.set(
        "family",
        "Material Symbols Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200",
    )
    stylesheetUrl.searchParams.set("icon_names", iconNames)

    const stylesheetResponse = await fetch(stylesheetUrl, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
    })

    if (!stylesheetResponse.ok) {
        throw new Error(`Could not fetch the icon stylesheet: ${stylesheetResponse.status}`)
    }

    const stylesheet = await stylesheetResponse.text()
    const fontUrl = stylesheet.match(/src: url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\) format\('woff2'\)/)?.[1]

    if (!fontUrl) {
        throw new Error("The icon stylesheet did not contain a WOFF2 font URL")
    }

    const fontResponse = await fetch(fontUrl)
    if (!fontResponse.ok) {
        throw new Error(`Could not fetch the icon font: ${fontResponse.status}`)
    }

    const font = new Uint8Array(await fontResponse.arrayBuffer())
    await writeFile(new URL("../public/my_icons.woff2", import.meta.url), font)
    console.log(`Wrote ${font.byteLength} bytes with ${icons.size} icons to public/my_icons.woff2`)
}
