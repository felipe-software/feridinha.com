"use client"

import NavBar from "@/components/Navbar"
import { Modal } from "@/components/Modal"
import LoginCallback from "@/components/LoginCallback"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import isPropValid from "@emotion/is-prop-valid"
import { StyleSheetManager } from "styled-components"
import { LuCheck, LuInfo, LuLoaderCircle, LuTriangleAlert, LuX } from "react-icons/lu"

const getIcon = ({ type }: any) => {
    switch (type) {
        case "info":
            return <LuInfo className="notification-icon notification-info" />
        case "error":
            return <LuX className="notification-icon notification-error" />
        case "success":
            return <LuCheck className="notification-icon notification-success" />
        case "warning":
            return <LuTriangleAlert className="notification-icon notification-warning" />
        case "default":
            return <LuLoaderCircle className="notification-icon notification-loading spin-animation" />
        default:
            return null
    }
}

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <StyleSheetManager
            enableVendorPrefixes
            shouldForwardProp={(propName, elementToBeRendered) => {
                return typeof elementToBeRendered === "string"
                    ? isPropValid(propName)
                    : true
            }}
        >
            <>
                <NavBar />
                <LoginCallback />
                {children}
                <ToastContainer
                    theme="dark"
                    autoClose={15000}
                    closeOnClick={true}
                    stacked={false}
                    toastClassName={"toast-notification"}
                    icon={getIcon}
                />
                <Modal />
            </>
        </StyleSheetManager>
    )
}
