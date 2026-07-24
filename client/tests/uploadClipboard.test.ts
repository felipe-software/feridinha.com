import { describe, expect, test } from "bun:test"
import { getClipboardHttpUrl, isEditablePasteTarget } from "@/components/landing/UploadBox/clipboard"

describe("social upload clipboard helpers", () => {
    test("accepts one HTTP(S) URL and trims surrounding whitespace", () => {
        expect(getClipboardHttpUrl("  https://www.tiktok.com/@user/video/123  ")).toBe(
            "https://www.tiktok.com/@user/video/123",
        )
        expect(getClipboardHttpUrl("http://reddit.com/r/test/comments/abc/post")).toBe(
            "http://reddit.com/r/test/comments/abc/post",
        )
    })

    test("rejects plain text, non-web protocols and multiple values", () => {
        expect(getClipboardHttpUrl("not a link")).toBeNull()
        expect(getClipboardHttpUrl("ftp://example.com/file")).toBeNull()
        expect(getClipboardHttpUrl("https://example.com/one https://example.com/two")).toBeNull()
    })

    test("does not hijack editable targets, including the social input", () => {
        const socialInput = { tagName: "INPUT" } as HTMLInputElement
        expect(isEditablePasteTarget(socialInput)).toBe(true)
        expect(isEditablePasteTarget({ tagName: "INPUT" } as never)).toBe(true)
        expect(isEditablePasteTarget({ tagName: "TEXTAREA" } as never)).toBe(true)
        expect(isEditablePasteTarget({ tagName: "DIV", isContentEditable: true } as never)).toBe(true)
        expect(isEditablePasteTarget({ tagName: "DIV", isContentEditable: false } as never)).toBe(false)
    })
})
