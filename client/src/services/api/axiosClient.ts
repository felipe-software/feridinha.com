import { getStoredLocale } from "@/i18n/client"
import axios from "axios"

export const axiosClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    validateStatus: () => true,
})

let sessionAbortController = new AbortController()

export const cancelPendingApiRequests = () => {
    sessionAbortController.abort()
    sessionAbortController = new AbortController()
}

export type ApiResponse<T = undefined> =
    | {
          success: false
          error: string
          code?: string
      }
    | {
          success: true
          data?: T
          message?: string
      }

axiosClient.interceptors.request.use((request) => {
    const locale = getStoredLocale()
    request.headers["x-locale"] = locale
    request.headers["Accept-Language"] = locale
    if (!request.signal) request.signal = sessionAbortController.signal
    return request
})
