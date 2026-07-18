import { useEffect } from "react"
import Banner from "./Banner"
import Cards from "./Cards"
import FeaturesBox from "./FeaturesBox"
import styles from "./landing.module.css"
import Reviews from "./Reviews"
import UploadBox from "./UploadBox"

export default function Page() {
    useEffect(() => {
        document.documentElement.style.setProperty(
            "--nav-highlight",
            "rgb(189, 147, 249)",
        )
    }, [])
    return (
        <div className={styles.pageContainer} key="landing" role="main">
            {/* <NavBar /> */}
            {/* <SnowFall
                style={{
                    position: "absolute",
                    width: "100vw",
                    height: "100%",
                    inset: 0,
                    zIndex: 5
                }}
            /> */}
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
