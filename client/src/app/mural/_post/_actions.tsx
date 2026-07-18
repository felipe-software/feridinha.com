import { useVoteMuralPost } from "@/hooks/mutations/useMuralMutations"
import { cn } from "@/utils"
import { $ApiMuralListItem } from "api-types"
import "dayjs/locale/pt-br"
import { useEffect, useState } from "react"
import { LuArrowBigDown, LuArrowBigUp } from "react-icons/lu"

export const PostReviewControls = ({ item }: { item: $ApiMuralListItem }) => {
    const voteMutation = useVoteMuralPost()
    const [upvotes, setUpvotes] = useState(item.upvotes)
    const [myLastVote, setMyLastVote] = useState(item.myVote)

    useEffect(() => {
        if (voteMutation.data?.success) {
            setUpvotes(voteMutation.data.data!.upvotes)
            setMyLastVote(voteMutation.data.data!.myVote)
        }
        // setUpvotes(item.upvotes)
    }, [voteMutation.data])
    return (
        <div
            className={cn(
                "flex flex-row bg-dracula-base/75 items-center rounded-full gap-4 px-4! py-1! _vote-container",
                myLastVote && (myLastVote === "up" ? "bg-[#56d45d] color-black" : "bg-dracula-red"),
            )}
        >
            <button
                className={cn(
                    "reset flex items-center justify-center  group transition-all duration-200",
                    myLastVote === "up" && "selected scale-120",
                    myLastVote === "down" && "opacity-50",
                )}
                onClick={() => {
                    voteMutation.mutateAsync({ id: item.id, vote: "up" })
                }}
                aria-selected={item.myVote === "up"}
            >
                <LuArrowBigUp className="scale-160 stroke-2 text-white group-[.selected]:fill-white" />
            </button>
            <p className="text-white font-semibold text-lg " style={{ 
                textShadow: "0px 0px 5px #0000009b"
             }}>{upvotes}</p>
            <button
                className={cn(
                    "reset flex items-center justify-center  group transition-all duration-200",
                    myLastVote === "down" && "selected scale-120",
                    myLastVote === "up" && "opacity-50",
                )}
                onClick={() => {
                    voteMutation.mutateAsync({ id: item.id, vote: "down" })
                }}
                aria-selected={item.myVote === "down"}
            >
                <LuArrowBigDown className="scale-160 stroke-2 text-white group-[.selected]:fill-white" />
            </button>
        </div>
    )
}
