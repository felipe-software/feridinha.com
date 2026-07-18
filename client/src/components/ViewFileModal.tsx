import { FilePreview } from "@/components/FilePreview"
import { Upload } from "@/hooks/useUserDataStore"
import { cdnUrl, formatFileSize } from "@/utils"
import styled from "styled-components"

export const ModalBase = styled.div`
    position: relative;
    width: 100%;
    /* height: 100%; */
    max-width: 50rem;
    height: fit-content;
    max-height: 70rem;
    overflow-y: auto;

    background-color: var(--base-dark);
    border-radius: 1rem;

    padding: 1rem 2rem;

    h1 {
        color: var(--foreground);
    }
    display: flex;
    flex-direction: column;
    /* align-items: center; */
    gap: 0.5rem;
    h1 {
        text-align: center;
    }
`

const Container = styled.div`
    position: relative;
    width: 100%;
    /* height: 100%; */
    max-width: 50rem;
    height: fit-content;
    max-height: 70rem;
    overflow-y: auto;

    background-color: var(--base-dark);
    border-radius: 1rem;

    padding: 1rem 2rem;

    h1 {
        color: var(--foreground);
    }
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    h1 {
        text-align: center;
    }

    a {
        font-size: 2rem;
        text-align: center;
        color: var(--dracula-cyan);
    }

    .metadata {
        display: flex;
        gap: 1rem;

        span {
            color: var(--foreground);
        }
    }

    .file-preview {
        .preview {
            max-height: 60vh;
        }
    }
`

export const ViewFileModal = ({ file }: { file: Upload }) => {
    return (
        <Container onClick={(e) => e.stopPropagation()}>
            <a target="_blank" href={`${cdnUrl}/${file.name}`}>{file.name}</a>
            <div className="metadata">
                <span>{formatFileSize(file.size)}</span>
                <span>{file.mimeType}</span>
                <span>{file.createdAt.toLocaleString()}</span>
            </div>
            <FilePreview
                upload={file}
                shouldHideData={true}
                className="file-preview"
            />
        </Container>
    )
}
