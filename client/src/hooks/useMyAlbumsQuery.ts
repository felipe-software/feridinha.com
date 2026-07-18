import apiService from "@/services/api"
import { useQuery } from "@tanstack/react-query"
import useTokenStore from "@/hooks/useToken"

export const useMyAlbumsQuery = () => { 
    const token = useTokenStore((state) => state.token)
    const query = useQuery({
        queryKey: ["my-albums"],
        queryFn: async () => {
            const response = await apiService.fetchMyAlbums()
            if (response.success) {
                return response.data
            }
        },
        enabled: Boolean(token),
    })

    return query
}
