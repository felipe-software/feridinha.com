import type { OAuthProviderName } from "@/hooks/useUserDataStore"
import apiService from "@/services/api"
import {
    useMutation,
    type UseMutationOptions,
} from "@tanstack/react-query"

type MutationOptions<TData, TVariables> = Omit<
    UseMutationOptions<TData, Error, TVariables>,
    "mutationFn" | "mutationKey"
>

type StartLinkResult = Awaited<ReturnType<typeof apiService.startOAuthLink>>
type CompleteLinkResult = Awaited<ReturnType<typeof apiService.completeOAuthLink>>
type CompleteMergeResult = Awaited<ReturnType<typeof apiService.completeOAuthMerge>>
type SetPrimaryResult = Awaited<ReturnType<typeof apiService.setPrimaryOAuthAccount>>
type UnlinkResult = Awaited<ReturnType<typeof apiService.unlinkOAuthAccount>>

export const useStartOAuthLinkMutation = (
    options?: MutationOptions<StartLinkResult, OAuthProviderName>,
) => useMutation({
    ...options,
    mutationKey: ["oauth", "link", "start"],
    mutationFn: apiService.startOAuthLink,
})

export const useCompleteOAuthLinkMutation = (
    options?: MutationOptions<CompleteLinkResult, string>,
) => useMutation({
    ...options,
    mutationKey: ["oauth", "link", "complete"],
    mutationFn: apiService.completeOAuthLink,
})

export const useCompleteOAuthMergeMutation = (
    options?: MutationOptions<CompleteMergeResult, string>,
) => useMutation({
    ...options,
    mutationKey: ["oauth", "merge", "complete"],
    mutationFn: apiService.completeOAuthMerge,
})

export const useSetPrimaryOAuthAccountMutation = (
    options?: MutationOptions<SetPrimaryResult, OAuthProviderName>,
) => useMutation({
    ...options,
    mutationKey: ["oauth", "primary", "set"],
    mutationFn: apiService.setPrimaryOAuthAccount,
})

export const useUnlinkOAuthAccountMutation = (
    options?: MutationOptions<UnlinkResult, OAuthProviderName>,
) => useMutation({
    ...options,
    mutationKey: ["oauth", "account", "unlink"],
    mutationFn: apiService.unlinkOAuthAccount,
})
