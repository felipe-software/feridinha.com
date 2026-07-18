import apiService from "@/services/api"
import { useQuery } from "@tanstack/react-query"

export const useHomeReviews = () => {
    return useQuery({
        queryKey: ["homeReviews"],
        queryFn: async () => {
            const response = await apiService.fetchReviews()
            return response
        },
        refetchOnMount: false,
    })
}
