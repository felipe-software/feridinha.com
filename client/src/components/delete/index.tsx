import { Button } from "@/components/Button"
import Loading from "@/components/Loading"
import { BasePageContainer } from "@/components/PageTransition"
import { BaseBox } from "@/components/dashboard/styles"
import apiService from "@/services/api"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "react-toastify"
import styled from "styled-components"

const PageContainer = styled(BasePageContainer)`
    display: flex;
    flex-direction: column;
    height: unset;
`

const Box = styled(BaseBox)`
    position: relative;
    padding: 2rem;
    color: #f8f8f8;
    margin: auto;

    width: 100%;
    max-width: 30rem;
    gap: 1.5rem;
    text-align: center;

    display: flex;
    flex-direction: column;
    align-items: center;

    background-color: var(--base-dark);
    border-radius: var(--border-radius-l);

    h1 {
        text-align: center;
        width: 100%;
    }

    button {
        border: none;
        background: none;
        padding: 0.75rem 2rem;
        font-size: 1rem;
        font-weight: 500;
    }

    p {
        color: var(--dracula-gray);
    }

    a {
        color: var(--dracula-cyan);
    }
`

const DeletePage = () => {
    const { secretId } = useParams()
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        setIsLoading(true)
        const response = await apiService.deleteUpload(Array.isArray(secretId) ? secretId[0] : (secretId || ""))
        setIsLoading(false)
        if (response.success) {
            toast.success("Arquivo deletado com sucesso")
            return
        }

        toast.error(response.error)
    }

    const isInvalid =
        typeof secretId === "string" &&
        (secretId.length < 3 || secretId.length > 128)

    useEffect(() => {
        if (typeof secretId !== "string") return
        if (!isInvalid) return
        toast.error("Código de exclusão inválido")
        router.push("/")
    }, [isInvalid, secretId])

    if (isInvalid) {
        return null
    }

    return (
        <PageContainer>
            <Box>
                <Loading isLoading={isLoading} />
                <h1>Deletar arquivo permanentemente</h1>
                <Button onClick={handleDelete} variant="red" children="Deletar" />
                <p>
                    Ao apagar uma imagem, ela será removida do seu histórico e
                    substituida por um{" "}
                    <a
                        href="https://f.feridinha.com/deleted.png"
                        target="_blank"
                    >
                        placeholder.
                    </a>
                </p>
            </Box>
        </PageContainer>
    )
}

export default DeletePage
