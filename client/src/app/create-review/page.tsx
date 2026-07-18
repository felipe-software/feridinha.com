"use client"

export const dynamic = "force-dynamic"

import { Button } from "@/components/Button"
import Loading from "@/components/Loading"
import apiService, { ApiResponse } from "@/services/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { LuSendHorizontal } from "react-icons/lu"
import styled from "styled-components"
import { z } from "zod"

const Container = styled.div`
    position: relative;
    width: 100%;
    max-width: 40rem;
    height: fit-content;

    background-color: var(--base-dark);
    border-radius: 1rem;

    padding: 1rem 2rem;

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;

    .header {
        display: flex;
        flex-direction: column;
        align-items: center;
        span {
            font-size: 3rem;
            font-variation-settings: "FILL" 1, "wght" 500, "GRAD" 0, "opsz" 20;
            color: #50fa7b;
            text-shadow: #50fa7a45 0px 0px 10px;
        }
        padding-bottom: 1rem;
    }

    h1 {
        color: var(--foreground);
    }

    form {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        width: 100%;
    }

    textarea {
        border: none;
        background-color: var(--base-dark);
        font-family: inherit;
        outline: 2px solid #afafaf76;
        border-radius: 0.5rem;
        padding: 0.5rem;
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
        }

        &.opcional {
            --color-light: #ffc88d97;
            --color-base: #ffb86c;
        }
    }

    p {
        color: var(--dracula-gray);
    }

    .input-wrapper {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        p.error {
            color: var(--dracula-red);
        }

        &:has(p.error) textarea {
            --color-light: #ff55559e;
            --color-base: #ff5555;
        }
    }

    .result-wrapper {
        position: absolute;
        width: 100%;
        height: 100%;
        inset: 0;
        border-radius: inherit;
        background-color: var(--base-dark);

        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        gap: 0.5rem;

        &.error {
            --color-light: #ff55555e;
            --color-base: #ff5555;
        }

        &.success {
            --color-base: #50fa7b;
            -color-light: #50fa7b5e;
        }

        p {
            color: var(--color-base);
            text-shadow: var(--color-light) 0px 0px 10px;
        }

        > span {
            font-size: 4rem;
            color: var(--color-base);
            text-shadow: var(--color-light) 0px 0px 10px;
        }
    }
`

const getFormSchema = (t: ReturnType<typeof useTranslations<"CreateReview">>) =>
    z.object({
        review: z
            .string()
            .min(3, t("minLength"))
            .max(300, t("maxLength")),
        suggestion: z.string().max(300, t("maxLength")),
    })

export default function CreateReviewPage() {
    const t = useTranslations("CreateReview")
    const formSchema = getFormSchema(t)
    const [response, setResponse] = useState<ApiResponse | null>(null)
    const [isLoading, setLoading] = useState(false)
    type Schema = z.infer<typeof formSchema>
    const { handleSubmit, formState, register } = useForm<Schema>({
        resolver: zodResolver(formSchema),
    })

    const handleCreate = async (data: Schema) => {
        setLoading(true)
        const response = await apiService.createReview(
            data.review,
            data.suggestion
        )
        setLoading(false)
        setResponse(response)
    }

    return (
        <Container onClick={(e) => e.stopPropagation()}>
            {response && (
                <div
                    className={
                        "result-wrapper " +
                        (response?.success ? "success" : "error")
                    }
                >
                    {response?.success ? (
                        <span className="notranslate material-icon">check_circle</span>
                    ) : (
                        <span className="notranslate material-icon">error</span>
                    )}
                    <p>
                        {response.success
                            ? response.message
                            : t("error")}
                    </p>
                </div>
            )}
            <Loading isLoading={isLoading} />
            <div className="header">
                <span className="notranslate material-icon">reviews</span>
                <h1>{t("title")}</h1>
            </div>
            <form onSubmit={handleSubmit(handleCreate)}>
                <div className="input-wrapper">
                    <textarea
                        id=""
                        placeholder={t("reviewPlaceholder")}
                        cols={30}
                        rows={4}
                        maxLength={300}
                        {...register("review")}
                    ></textarea>
                    {formState.errors.review && (
                        <p className="error">
                            {formState.errors.review.message}
                        </p>
                    )}
                </div>
                <div className="input-wrapper">
                    <textarea
                        className="opcional"
                        placeholder={t("suggestionPlaceholder")}
                        cols={30}
                        rows={2}
                        maxLength={300}
                        {...register("suggestion")}
                    ></textarea>
                    {formState.errors.suggestion && (
                        <p className="error">
                            {formState.errors.suggestion.message}
                        </p>
                    )}
                </div>
                <Button
                    className="review-button"
                    icon={<LuSendHorizontal />}
                    variant="green"
                    children={t("submit")}
                    iconSide="right"
                />
                <p>{t("notice")}</p>
            </form>
        </Container>
    )
}
