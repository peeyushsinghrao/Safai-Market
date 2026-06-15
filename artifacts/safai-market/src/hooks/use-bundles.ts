import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface BundleItemData {
  id: number;
  bundleId: number;
  productId: number;
  productNameSnapshot: string;
  quantity: string;
  buyPriceSnapshot: string;
}

export interface BundleData {
  id: number;
  name: string;
  description: string | null;
  barcode: string | null;
  sellPrice: string;
  buyPriceComputed: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items: BundleItemData[];
  availableStock: number;
}

const BUNDLES_KEY = ["bundles"];

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json", ...options.headers };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export function useBundles() {
  return useQuery<BundleData[]>({
    queryKey: BUNDLES_KEY,
    queryFn: () => apiFetch("/api/bundles"),
  });
}

export function useBundle(id: number) {
  return useQuery<BundleData>({
    queryKey: [...BUNDLES_KEY, id],
    queryFn: () => apiFetch(`/api/bundles/${id}`),
    enabled: !!id,
  });
}

export function useCreateBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      barcode?: string;
      sellPrice: number;
      items: Array<{ productId: number; quantity: number }>;
    }) => apiFetch("/api/bundles", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUNDLES_KEY });
    },
  });
}

export function useUpdateBundle(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name?: string;
      description?: string;
      barcode?: string;
      sellPrice?: number;
      isActive?: boolean;
      items?: Array<{ productId: number; quantity: number }>;
    }) => apiFetch(`/api/bundles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUNDLES_KEY });
    },
  });
}

export function useDeactivateBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const current = queryClient.getQueryData<BundleData[]>(BUNDLES_KEY);
      const bundle = current?.find(b => b.id === id);
      return apiFetch(`/api/bundles/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !bundle?.isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUNDLES_KEY });
    },
  });
}

export function useDeleteBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/api/bundles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUNDLES_KEY });
    },
  });
}
