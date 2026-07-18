import apiService from "@/services/api"
import { useQuery } from "@tanstack/react-query"

export const useAlbumQuery = (albumId?: string) => {
    const query = useQuery({
        queryKey: ["album", albumId],
        queryFn: async () => {
            const response = await apiService.fetchAlbum(albumId!)
            if (response.success) {
                return response.data
            }
            
        },
        enabled: Boolean(albumId),
    })

    return query
}
