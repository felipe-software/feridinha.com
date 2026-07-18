import z from "zod";

export const createMuralPostFormSchema = (messages?: {
    invalidTitle?: string
    invalidDescription?: string
}) =>
    z.object({
        link: z.string().url().min(1),
        title: z.string().max(120, messages?.invalidTitle ?? "Title is too long").optional().default(""),
        description: z.string().max(300, messages?.invalidDescription ?? "Description is too long").optional().default(""),
    })

export const muralPostFormSchema = createMuralPostFormSchema()

export const createAddModeratorSchema = (messages?: { minQuery?: string }) =>
    z.object({
        query: z.string().min(3, messages?.minQuery ?? "Type at least 3 characters"),
    })

export const addModeratorSchema = createAddModeratorSchema()
