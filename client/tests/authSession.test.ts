import { beforeAll, describe, expect, test } from "bun:test"

const storage = new Map<string, string>()

beforeAll(() => {
    Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: (key: string, value: string) => storage.set(key, value),
            removeItem: (key: string) => storage.delete(key),
            clear: () => storage.clear(),
        },
    })
})

describe("authenticated account isolation", () => {
    test("clears queries, user data, API secrets, modal and persisted token", async () => {
        const [{ default: queryClient }, { clearAuthSession }, { default: useTokenStore }, { default: useUserDataStore }, { default: useApiKeysStore }, { useModalStore }] =
            await Promise.all([
                import("@/config/queryClient"),
                import("@/services/api/authSession"),
                import("@/hooks/useToken"),
                import("@/hooks/useUserDataStore"),
                import("@/hooks/useApiKeysStore"),
                import("@/hooks/useModalStore"),
            ])

        queryClient.setQueryData(["my-albums"], [{ id: "old-account-album" }])
        useTokenStore.getState().setToken("old-account-token")
        useUserDataStore.getState().setUserData({ id: "old-account" } as never)
        useApiKeysStore.getState().set([{ id: "key", name: "old", secret: "secret", createdAt: new Date() }])
        useModalStore.getState().setPage({ jsx: "private modal" })

        await clearAuthSession()

        expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
        expect(useTokenStore.getState().token).toBeNull()
        expect(useUserDataStore.getState().userData).toBeNull()
        expect(useApiKeysStore.getState().apiKeys).toEqual([])
        expect(useModalStore.getState().page).toBeNull()
        expect(storage.has("token-storage")).toBe(false)
    })
})
