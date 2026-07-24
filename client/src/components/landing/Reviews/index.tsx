import { Button } from "@/components/Button"
import Loading from "@/components/Loading"
import { useModalStore } from "@/hooks/useModalStore"
import CreateReviewPage from "@/app/[locale]/create-review/page"
import apiService, { MyReview, Review } from "@/services/api"
import { useFormatter, useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { LuBan, LuCheckCheck, LuHourglass, LuPencil } from "react-icons/lu"
import { toast } from "react-toastify"
import { Box, CarouselBase, Container } from "./styles"
import Image from "next/image"

export default function Reviews() {
    const modalStore = useModalStore()
    const t = useTranslations("Reviews")
    const format = useFormatter()
    const [isLoading, setIsLoading] = useState(true)
    const [reviews, setReviews] = useState<Review[] | null>(null)
    const [myReview, setMyReview] = useState<MyReview | null>(null)
    const containerVariants = {
        hidden: {
            y: -60,
            opacity: 0,
        },
        visible: {
            y: 0,
            opacity: 1,
        },
    }

    const fetchReviews = async () => {
        setIsLoading(true)
        const response = await apiService.fetchReviews()
        if (response.success) {
            setReviews(response.data!.public)
            setMyReview(response.data!.yours)
        } else {
            toast.error(response.error)
        }

        setIsLoading(false)
    }

    useEffect(() => {
        fetchReviews()
    }, [])

    const handleCreateReview = () => {
        modalStore.setPage({ jsx: <CreateReviewPage /> })
    }

    return (
        <>
            <Container
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
            >
                <h2>
                    <span className="notranslate">reviews</span> {t("sectionTitle")}
                </h2>
                {!isLoading && !myReview && (
                    <Button
                        className="review-button"
                        icon={<LuPencil />}
                        variant="green"
                        children={t("writeReview")}
                        onClick={handleCreateReview}
                    />
                )}
                {myReview &&
                    !myReview.hasBeenApproved &&
                    !myReview.notApprovedReason && (
                        <Button
                            className="review-button"
                            icon={<LuHourglass />}
                            variant="cyan"
                            children={t("pending")}
                            onClick={() => {
                                toast.info(t("pendingInfo"))
                            }}
                        />
                    )}

                {myReview && myReview.notApprovedReason && (
                    <Button
                        className="review-button"
                        icon={<LuBan />}
                        variant="red"
                        children={
                            <>
                                {t("rejected")}
                                <br />
                                {t("clickForDetails")}
                            </>
                        }
                        onClick={() => {
                            toast.info(`${t("rejectionReason")}: ${myReview.notApprovedReason ?? t("notProvided")}`)
                        }}
                    />
                )}

                {myReview && myReview.hasBeenApproved && (
                    <Button
                        className="review-button"
                        icon={<LuCheckCheck />}
                        variant="green"
                        children={t("approved")}
                        onClick={() => {
                            toast.info(t("approvedInfo"))
                        }}
                    />
                )}
                {/* <button className="review-button" onClick={handleCreateReview}>
                <span className="notranslate material-icon">edit</span>
                Criar review
            </button> */}

                <CarouselBase
                    infiniteLoop={false}
                    showStatus={false}
                    autoPlay={true}
                    interval={7000}
                    showThumbs={false}
                    swipeable={true}
                    showIndicators={false}
                    showArrows={true}
                    stopOnHover={true}
                    // dynamicHeight={true}
                >
                    {(reviews || []).map((review) => (
                        <Box key={review.id} className="box">
                            <Image
                                className="profile-picture no-select"
                                src={review.user.profileImage}
                                alt={t("userImageAlt")}
                                style={{
                                    aspectRatio: "1/1",
                                    height: "75%",
                                    width: "auto",
                                }}
                                height={200}
                                width={200}
                                loading="lazy"
                            ></Image>
                            <div className="about">
                                <h4>{review.content}</h4>
                                <span className="user">
                                    <a
                                        className="author"
                                        style={{ color: review.user.color }}
                                        href={`//twitch.tv/${review.user.name}`}
                                        target="_blank"
                                    >
                                        @{review.user.name}
                                    </a>
                                    <p className="profession">
                                        {t("userSince", {
                                            date: format.dateTime(new Date(review.user.createdAt), {
                                                day: "numeric",
                                                month: "numeric",
                                                year: "numeric",
                                            }),
                                            count: review.user.uploadCount,
                                        })}
                                    </p>
                                </span>
                            </div>
                        </Box>
                    ))}
                </CarouselBase>
                {reviews?.length === 0 && (
                    <p
                        style={{
                            color: "var(--dracula-gray)",
                            textAlign: "center",
                            fontSize: "1.25rem",
                            padding: "3rem 0",
                        }}
                    >
                        {t("noneFound")}
                    </p>
                )}
            </Container>
            <Loading isLoading={isLoading} message={t("loading")} />
        </>
    )
}
