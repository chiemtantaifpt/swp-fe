import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userProfileApi } from "@/services/user-profile.api";
import type { UpdateUserProfilePayload } from "@/services/profile.types";

export const useUserProfile = (enabled = true) =>
  useQuery({
    queryKey: ["userProfile", "me"],
    queryFn: userProfileApi.getMe,
    enabled,
  });

export const useUserProfileById = (userId?: string | null, enabled = true) =>
  useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => userProfileApi.getById(userId!),
    enabled: enabled && !!userId,
  });

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateUserProfilePayload) => userProfileApi.updateMe(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
};

export const useUpdateUserProfileById = (userId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateUserProfilePayload) => userProfileApi.updateById(userId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
};
