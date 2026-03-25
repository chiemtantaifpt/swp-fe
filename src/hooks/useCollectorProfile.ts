import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { collectorProfileApi } from "@/services/collector-profile.api";
import type {
  CollectorProfileListParams,
  CreateCollectorProfilePayload,
  UpdateCollectorProfilePayload,
} from "@/services/profile.types";

export const useCollectorProfileMe = (enabled = true) =>
  useQuery({
    queryKey: ["collectorProfile", "me"],
    queryFn: collectorProfileApi.getMe,
    enabled,
  });

export const useCollectorProfiles = (params?: CollectorProfileListParams, enabled = true) =>
  useQuery({
    queryKey: ["collectorProfiles", params],
    queryFn: () => collectorProfileApi.getPaged(params),
    enabled,
  });

export const useAllCollectorProfiles = (enabled = true) =>
  useQuery({
    queryKey: ["collectorProfiles", "all"],
    queryFn: collectorProfileApi.getAll,
    enabled,
  });

export const useCollectorProfileById = (id?: string | null, enabled = true) =>
  useQuery({
    queryKey: ["collectorProfiles", id],
    queryFn: () => collectorProfileApi.getById(id!),
    enabled: enabled && !!id,
  });

export const useCreateCollectorProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateCollectorProfilePayload) => collectorProfileApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collectorProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["collectorProfile"] });
    },
  });
};

export const useUpdateCollectorProfile = (id?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateCollectorProfilePayload) => collectorProfileApi.update(id!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collectorProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["collectorProfile"] });
    },
  });
};

export const useDeleteCollectorProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => collectorProfileApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collectorProfiles"] });
      queryClient.invalidateQueries({ queryKey: ["collectorProfile"] });
    },
  });
};
