import { Button } from "@/components/Button"
import Loading from "@/components/Loading"
import { subpageTransition } from "@/components/PageTransition"
import { useMyAlbumsQuery } from "@/hooks/useMyAlbumsQuery"
import { AlbumItem } from "@/components/dashboard/AlbunsView/AlbumItem"
import { AlbunsBox } from "@/components/dashboard/AlbunsView/styles"
import { memo } from "react"
import { useTranslations } from "next-intl"
import { LuImage } from "react-icons/lu"
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry"

export const AlbunsView = memo(
    ({
        handleChangeView,
    }: {
        handleChangeView: (view: "uploads" | "albuns") => void
    }) => {
        const albums = useMyAlbumsQuery()
        const t = useTranslations("Dashboard")

        return (
            <AlbunsBox {...subpageTransition}>
                <Loading isLoading={albums.isPending} />
                <div className="title-wrapper">
                    <p className="title">
                        {t("yourAlbums", {
                            count: albums.data?.length ?? t("loading"),
                        })}
                    </p>
                    <p style={{ color: "var(--dracula-gray)" }}>
                        {t("albumsWip")}
                    </p>
                    <Button
                        size="slim"
                        variant="purple"
                        icon={<LuImage />}
                        children={t("viewMyUploads")}
                        onClick={() => handleChangeView("uploads")}
                    />
                </div>

                <div className="items-container">
                    <ResponsiveMasonry
                        columnsCountBreakPoints={{
                            350: 1,
                            750: 2,
                            900: 3,
                            1200: 4,
                        }}
                    >
                        <Masonry sequential={true}>
                            {albums.data?.map((album) => (
                                <AlbumItem key={album.id} album={album} />
                            ))}
                        </Masonry>
                    </ResponsiveMasonry>
                </div>
            </AlbunsBox>
        )
    }
)
