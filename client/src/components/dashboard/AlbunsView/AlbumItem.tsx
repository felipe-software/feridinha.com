import { FileUploadRenderer } from "@/components/FilePreview"
import type { Album } from "@/services/api"
import styled from "styled-components"

const Container = styled.div<{ columnsCount: number }>`
    border-radius: 0.5rem;
    padding: 0.5rem;
    background-color: var(--base);
    cursor: pointer;

    min-height: 20rem;
    width: 100%;
    aspect-ratio: 1/1;

    audio {
        aspect-ratio: 1/1;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .renderer {
        width: 100%;
        height: 100%;
        display: grid;
        overflow: hidden;
        grid-template-columns: repeat(${(p) => p.columnsCount}, 1fr);
        grid-auto-rows: 1fr;
        gap: 0.5rem;

        > * {
            border-radius: 0.25rem;
            --grey: #cccccc16;
            background-image: linear-gradient(
                    45deg,
                    var(--grey) 25%,
                    transparent 25%
                ),
                linear-gradient(-45deg, var(--grey) 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, var(--grey) 75%),
                linear-gradient(-45deg, transparent 75%, var(--grey) 75%);
            background-size: 16px 16px;
            background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
            background-color: var(--base);
        }
    }

    img,
    video{
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
`

export const AlbumItem = ({ album }: { album: Album }) => {
    const minCount = 8
    const itemsCount = Math.min(album.uploads.length, minCount)

    return (
        <Container
            columnsCount={itemsCount > 1 ? 2 : 1}
            onClick={() => window.open(`/album/${album.id}`, "_blank")}
        >
            <div className="renderer">
                {album.uploads.slice(0, minCount).map((upload) => (
                    <FileUploadRenderer
                        skipLazy={true}
                        key={upload.name}
                        upload={upload}
                    />
                ))}
            </div>
        </Container>
    )
}
