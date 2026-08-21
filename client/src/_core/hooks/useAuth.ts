import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useMemo } from "react";

type UseAuthOptions = { redirectOnUnauthenticated?: boolean };

export function useAuth(_options?: UseAuthOptions) {
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const logoutMutation = trpc.auth.logout.useMutation({ onSuccess: () => utils.auth.me.setData(undefined, null) });
  const logout = useCallback(async () => { try { await logoutMutation.mutateAsync(); } catch (error) { if (!(error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED")) throw error; } finally { await utils.auth.me.invalidate(); } }, [logoutMutation, utils]);
  return useMemo(() => ({ user: meQuery.data ?? null, loading: meQuery.isLoading || logoutMutation.isPending, error: meQuery.error ?? logoutMutation.error ?? null, isAuthenticated: Boolean(meQuery.data), logout, refresh: () => meQuery.refetch() }), [meQuery.data, meQuery.error, meQuery.isLoading, logoutMutation.error, logoutMutation.isPending, logout, meQuery]);
}
