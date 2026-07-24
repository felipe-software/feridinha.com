"use client"

export const dynamic = "force-dynamic"

import { useEffect } from "react"
import Banner from "@/components/landing/Banner"
import Cards from "@/components/landing/Cards"
import FeaturesBox from "@/components/landing/FeaturesBox"
import styles from "@/components/landing/landing.module.css"
import Reviews from "@/components/landing/Reviews"
import UploadBox from "@/components/landing/UploadBox"

export default function Page() {
    useEffect(() => {
        document.documentElement.style.setProperty(
            "--nav-highlight",
            "rgb(189, 147, 249)",
        )
    }, [])
    return (
        <div className={styles.pageContainer} key="tutorial" style={{ viewTransitionName: "page-content" }}>
            <div
                className={styles.wrapper}
                style={{
                    minHeight: "fit-content",
                    background: "var(--base)",
                }}
            >
                <FeaturesBox />
                <UploadBox />
            </div>
            <div
                className={styles.wrapper}
                style={{ backgroundColor: "var(--base-dark-transparent)" }}
            >
                <Cards />
            </div>
            <div
                className={styles.wrapper}
                style={{ backgroundColor: "var(--base)" }}
            >
                <Reviews />
            </div>
            <div
                className={styles.wrapper}
                style={{ backgroundColor: "var(--base-dark-transparent)" }}
            >
                <Banner />
            </div>
        </div>
    )
}
