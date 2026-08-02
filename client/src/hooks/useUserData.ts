import useTokenStore from "@/hooks/useToken"
import useUserDataStore from "@/hooks/useUserDataStore"
import { useUserDataQuery } from "@/hooks/queries/useUserDataQuery"
import { useEffect } from "react"

const useUserData = () => {
    const { token } = useTokenStore()
    const { setUserData } = useUserDataStore()
    const query = useUserDataQuery({ enabled: Boolean(token) })

    useEffect(() => {
        if (query.data) setUserData(query.data)
    }, [query.data, setUserData])

    return query
}

export default useUserData
