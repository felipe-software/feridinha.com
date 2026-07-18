"use client"
import { createMuralPostFormSchema } from "@/app/mural/_validations"
import { Button } from "@/components/Button"
import { useCreatePostMutation } from "@/hooks/mutations/usePostMutations"
import { useModalStore } from "@/hooks/useModalStore"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import styled from "styled-components"
import z from "zod"

export const MyInputWrapper = styled.div`
    input {
        border: none;
        background-color: var(--base-dark);
        font-family: inherit;
        outline: 2px solid #afafaf76;
        border-radius: 0.5rem;
        padding: 0.75rem 1rem;
        color: var(--foreground);
        max-width: 100%;
        width: 100%;
        transition: 0.2s;
        resize: none;

        &::placeholder {
            color: #afafaf76;
            font-family: inherit;
        }

        --color-light: #68fd8d9e;
        --color-base: #50fa7b;

        &:hover {
            outline: 2px solid var(--color-light);
            background-color: rgb(21, 22, 29);
        }

        &:focus {
            outline: 2px solid var(--color-base);
            background-color: rgb(21, 22, 29);
        }

        &.opcional {
            --color-light: #ffc88d97;
            --color-base: #ffb86c;
        }
    }

    p {
        color: var(--dracula-gray);
    }

    &:has(p) input {
        --color-light: #ff55559e !important;
        --color-base: #ff5555 !important;
        outline: 2px solid #ff5555;
    }

    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    p.error {
        color: var(--dracula-red);
    }
`

const CreatePostWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;

    background-color: var(--base-dark);
    border-radius: 1rem;
    padding: 1rem;
    width: 100%;

    a {
        /* color: var(--dracula-cyan); */
    }

    form {
    }
`

export const CreatePostForm = ({ communityId }: { communityId: string }) => {
    const t = useTranslations("Mural")
    const createPostMutation = useCreatePostMutation()
    const modalStore = useModalStore()
    const formSchema = useMemo(
        () =>
            createMuralPostFormSchema({
                invalidTitle: t("invalidTitle"),
                invalidDescription: t("invalidDescription"),
            }),
        [t],
    )

    type FormValues = z.infer<typeof formSchema>

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { link: "" },
        mode: "onSubmit",
    })

    const errors = form.formState.errors

    const handleSuccess = useCallback((data: FormValues) => {
        createPostMutation
            .mutateAsync({ link: data.link, communityId, title: data.title, description: data.description })
            .then(() => {
                modalStore.setPage(null)
            })
    }, [communityId, createPostMutation, modalStore])

    return (
        <CreatePostWrapper
            className="px-6! w-full max-w-160 gap-4! py-8!"
            onClick={(e) => {
                e.stopPropagation()
            }}
        >
            <h1 className="text-white mb-2!">{t("createPostTitle")}</h1>
            <form onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit(handleSuccess)(e);
            }} className="flex flex-col gap-4 items-start ">
                <MyInputWrapper className="gap-4! my-2!">
                    <div className="flex-col flex gap-1">
                        <input placeholder={t("titlePlaceholder")} {...form.register("title")} />
                        {errors.title && <p className="text-dracula-red! error">{errors.title.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1">
                        <input
                            placeholder={t("contentPlaceholder")}
                            {...form.register("link")}
                        />
                        {errors.link && <p className="text-dracula-red! error">{errors.link.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1">
                        <input placeholder={t("descriptionPlaceholder")} {...form.register("description")} />
                        {errors.description && <p className="text-dracula-red! error">{errors.description.message}</p>}
                    </div>
                </MyInputWrapper>
                <p className="text-white">
                    {t.rich("createPostAgreement", {
                        terms: (chunks) => (
                            <a href="/termos-de-servico" target="_blank" className="text-dracula-cyan">
                                {chunks}
                            </a>
                        ),
                    })}
                </p>
                <Button variant="green" type="submit">
                    {t("createPostButton")}
                </Button>
            </form>
        </CreatePostWrapper>
    )
}
