import { useTranslations } from "next-intl"
import { FormEventHandler, RefObject } from "react"
import styled, { keyframes } from "styled-components"

const GradientBackground = keyframes`
    0% {
        background-position: 15% 0%;
    }
    50% {
        background-position: 86% 100%;
    }
    100% {
        background-position: 15% 0%;
    }

`

const SocialLinkBar = styled.form`
    position: relative;
    z-index: 0;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: start;
    gap: 0.5rem;
    width: calc(100% - 2rem);
    padding: 0.5rem 0.5rem;

    border-bottom: 0;
    border-radius: 1rem 1rem 0.25rem 0.25rem;
    background: var(--base-dark);
    color: var(--foreground);
    cursor: default;
    margin-bottom: 1px;

    .social-link-label {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.78rem;
        line-height: 1.2;
        color: #c5c7d2;
        white-space: nowrap;
    }

    .new-badge {
        border: 1px solid #bd93f9;
        border-radius: 999px;
        padding: 0.12rem 0.45rem;
        background: rgba(189, 147, 249, 0.12);
        color: #d9bcff;
        font-family: inherit;
        font-size: 0.66rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        cursor: help;

        &:focus-visible {
            outline: 2px solid var(--dracula-cyan);
            outline-offset: 2px;
        }
    }

    .social-link-controls {
        display: flex;
        min-width: 0;
        gap: 0.5rem;
        flex-grow: 1;
        width: 100%;
    }

    .social-link-controls input {
        min-width: 0;
        flex: 1;
        border: 1px solid #4b4e60;
        border-radius: 0.55rem;
        outline: none;
        background: rgba(17, 18, 24, 0.92);
        color: var(--foreground);
        font-family: inherit;
        font-size: 0.82rem;
        padding: 0.68rem 0.8rem;
        transition:
            border-color 0.2s,
            background-color 0.2s;
        flex-grow: 1;
        width: 100%;

        &::placeholder {
            color: #9497a6;
        }

        &:hover {
            border-color: #686b7e;
        }

        &:focus {
            border-color: #bd93f9;
            background: #111218;
        }
    }

    .import-link {
        border: 1px solid rgba(189, 147, 249, 0.55);
        border-radius: 0.55rem;
        background: rgba(189, 147, 249, 0.14);
        color: #eadcff;
        padding: 0.68rem 0.9rem;
        font-family: inherit;
        font-size: 0.82rem;
        font-weight: 650;
        white-space: nowrap;
        cursor: pointer;
        transition:
            background-color 0.2s,
            border-color 0.2s,
            opacity 0.2s,
            transform 0.1s;

        &:hover:not(:disabled),
        &:focus-visible {
            border-color: #bd93f9;
            background: rgba(189, 147, 249, 0.24);
        }

        &:active:not(:disabled) {
            transform: translateY(1px);
        }

        &:focus-visible {
            outline: 2px solid var(--dracula-cyan);
            outline-offset: 2px;
        }

        &:disabled {
            cursor: not-allowed;
            opacity: 0.45;
        }
    }

    @media (max-width: 612px) {
        grid-template-columns: 1fr;
        gap: 0.55rem;
        width: calc(100% - 1.5rem);
        padding-inline: 0.7rem;

        .social-link-label {
            justify-content: space-between;
            white-space: normal;
        }
    }

    @media (max-width: 420px) {
        .social-link-controls {
            flex-direction: column;
        }

        .social-link-controls input,
        .import-link {
            width: 100%;
        }
    }

    .new-tag {
        position: absolute;
        top: -0.5rem;
        right: -1rem;
        background: linear-gradient(318deg, var(--pink-gradient), var(--purple-gradient));
        background-size: 150% 150%;
        -webkit-animation: ${GradientBackground} 5s ease infinite;
        -moz-animation: ${GradientBackground} 5s ease infinite;
        animation: ${GradientBackground} 5s ease infinite;
        padding: 0.25rem 0.5rem;
        border-radius: 0.5rem;
        transform: rotateZ(10deg);
        box-shadow: 0px 0px 5px #00000050;

        font-size: 0.875rem;
        font-weight: 500;
        line-height: 0.85rem;
    }
`

interface SocialLinkFormProps {
    inputRef: RefObject<HTMLInputElement | null>
    value: string
    onChange: (value: string) => void
    onImport: (link: string) => void
}

export default function SocialLinkForm({ inputRef, value, onChange, onImport }: SocialLinkFormProps) {
    const t = useTranslations("UploadBox")

    const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault()
        onImport(value)
    }

    return (
        <SocialLinkBar onSubmit={handleSubmit} noValidate>
            {/* <div className="social-link-label">
                <label htmlFor="social-link">{t("socialLinkLabel")}</label>
                <Tooltip content={t("socialLinkTooltip")} maxWidth={320} trigger="mouseenter focus click">
                    <button type="button" className="new-badge" aria-label={t("socialLinkTooltipLabel")}>
                        {t("newBadge")}
                    </button>
                </Tooltip>
            </div> */}
            <div className="social-link-controls">
                <input
                    id="social-link"
                    ref={inputRef}
                    type="url"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={t("socialLinkPlaceholder")}
                    aria-label={t("socialLinkInputLabel")}
                    autoComplete="off"
                />
                <div className="new-tag">{t("newTag")}</div>
                {/* <button type="submit" className="import-link" disabled={!value.trim()}>
                    {t("importLink")}
                </button> */}
            </div>
        </SocialLinkBar>
    )
}
