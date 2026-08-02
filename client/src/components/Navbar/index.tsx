"use client"

import { AppLocale } from "@/i18n/config"
import { Link, usePathname, useRouter } from "@/i18n/navigation"
import { getLocaleSwitchHref } from "@/i18n/switchLocale"
import { LocaleSelector } from "@/components/LocaleSelector"
import LoginButton from "@/components/LoginButton"
import { LogoText } from "@/components/LogoText"
import { BrainMadeIcon } from "@/components/Navbar/BrainMadeIcon"
import Nav from "@/components/Navbar/styles"
import { OpenSourceBadge } from "@/components/OpenSourceBadge"
import Tooltip from "@/components/Tooltip"
import useUserData from "@/hooks/useUserData"
import { UserData } from "@/hooks/useUserDataStore"
import { AnimatePresence, motion } from "motion/react"
import { useLocale, useTranslations } from "next-intl"
import { memo, useEffect, useState } from "react"
import styled from "styled-components"

const LinkBase = ({
    path,
    children,
    aProps,
}: {
    path: string
    children: string
    aProps?: React.AnchorHTMLAttributes<HTMLAnchorElement>
}) => {
    const router = useRouter()
    const pathname = usePathname()
    const isActive = pathname === path || pathname.startsWith(path + "/")

    return (
        <Link
            onMouseEnter={() => {
                router.prefetch(path)
            }}
            prefetch={true}
            href={path}
            className={isActive ? "active" : ""}
            {...aProps}
        >
            {children}
            {isActive && (
                <motion.span className={"underline_active"} layoutId="underline_active" transition={{}}></motion.span>
            )}
        </Link>
    )
}

function NavLinks({
    userData,
    isLoading,
    isMuralAvailable,
}: {
    userData?: UserData
    isLoading?: boolean
    isMuralAvailable?: boolean
}) {
    const t = useTranslations("Nav")

    return (
        <>
            {isMuralAvailable && <LinkBase path="/mural">{t("mural")}</LinkBase>}
            <LinkBase path="/">{t("upload")}</LinkBase>
            <LinkBase path="/tutorial">{t("tutorial")}</LinkBase>
            <LinkBase path="/faq">{t("faq")}</LinkBase>
            <a
                href="https://sync.feridinha.com"
                target="_blank"
                rel="nofollow external noopener noreferrer"
            >
                Sync
            </a>

            {!userData && !isLoading && <LoginButton />}
            {(isLoading || userData) && <LinkBase path="/dashboard">{t("dashboard")}</LinkBase>}
        </>
    )
}

const BrainMadeWrapper = styled.a`
    padding: 0.5rem;
    border-radius: 0.5rem;
    transition: all 0.3s ease;

    img {
        transition: all 0.3s ease;
    }

    &:hover {
        background-color: #ffffff;

        img,
        svg {
            filter: invert(1);
        }
    }
`

function NavBar_({
    isMuralAvailable,
    isOpenSource = false,
}: {
    isMuralAvailable?: boolean
    isOpenSource?: boolean
}) {
    const [isMenuActive, setMenuActive] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const locale = useLocale() as AppLocale
    const t = useTranslations("Nav")

    const user = useUserData()

    const handleMenu = () => {
        setMenuActive(!isMenuActive)
    }

    useEffect(() => {
        const media = window.matchMedia("(max-width: 1100px)")
        const onChange = () => {
            setIsMobile(media.matches)
        }
        onChange()
        media.addEventListener("change", onChange)
        return () => {
            media.removeEventListener("change", onChange)
        }
    }, [pathname])

    useEffect(() => {
        setMenuActive(false)
    }, [pathname])

    const handleLocaleChange = (targetLocale: AppLocale) => {
        document.documentElement.lang = targetLocale
        router.replace(getLocaleSwitchHref(pathname, window.location.search), {
            locale: targetLocale,
        })
    }

    return (
        <Nav>
            <LocaleSelector locale={locale} onChange={handleLocaleChange} />
            <Link href="/" className="logo" aria-label="Feridinha.com">
                <LogoText
                    aria-hidden="true"
                    style={{ zIndex: 7, position: "relative" }}
                    autoAnimate={true}
                    autoAnimateTiming={10000}
                    autoAnimateDelay={0}
                >
                    Feridinha.com
                </LogoText>
            </Link>
            <div className="description-container">
                <OpenSourceBadge isOpenSource={isOpenSource} username={user.data?.name} />
                {!isOpenSource && (
                    <Tooltip content={t("brainMade")} arrow={false} maxWidth={400}>
                        <BrainMadeWrapper
                            className="brain-made"
                            style={{ display: "flex" }}
                            href="https://brainmade.org/"
                            target="_blank"
                            rel="external noopener noreferrer"
                            aria-label={`Brainmade.org — ${t("brainMade")}`}
                        >
                            <BrainMadeIcon />
                        </BrainMadeWrapper>
                    </Tooltip>
                )}
            </div>
            {isMobile && (
                <button
                    type="button"
                    className={"burgerMenu"}
                    onClick={handleMenu}
                    aria-expanded={isMenuActive}
                    aria-controls="mobile-navigation"
                    aria-label={isMenuActive ? t("closeMenu") : t("openMenu")}
                >
                    <span className="notranslate material-symbols-rounded" aria-hidden="true">
                        {isMenuActive ? "close" : "menu"}
                    </span>
                </button>
            )}
            {!isMobile && (
                <div className={"links"}>
                    <NavLinks userData={user.data} isLoading={user.isLoading} isMuralAvailable={isMuralAvailable} />
                </div>
            )}
            <AnimatePresence initial={false} mode="wait" onExitComplete={() => null}>
                {/* {!isMobile && (
                    <div className={"links"}>
                        <NavLinks
                            userData={user.data}
                            isLoading={user.isLoading}
                        />
                    </div>
                )} */}
                {isMobile && isMenuActive && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={2}>
                        <div className={"menu"} id="mobile-navigation">
                            <NavLinks userData={user.data} isMuralAvailable={isMuralAvailable} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Nav>
    )
}
const NavBar = memo(NavBar_)
export default NavBar
export type { NavBar_ as NavBarProps }
