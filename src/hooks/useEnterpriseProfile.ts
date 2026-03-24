import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enterpriseProfileApi } from "@/services/enterprise-profile.api";
import type {
  SetEnvironmentLicensePayload,
  SubmitEnterpriseProfilePayload,
  UpsertEnterpriseProfilePayload,
} from "@/services/profile.types";

export const useEnterpriseProfile = (enabled = true) =>
  useQuery({
    queryKey: ["enterpriseProfile", "me"],
    queryFn: enterpriseProfileApi.getMe,
    enabled,
  });

export const useEnterpriseDocuments = (enabled = true) =>
  useQuery({
    queryKey: ["enterpriseProfile", "documents"],
    queryFn: enterpriseProfileApi.getDocuments,
    enabled,
  });

export const useUpsertEnterpriseProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpsertEnterpriseProfilePayload) => enterpriseProfileApi.upsertMe(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enterpriseProfile"] });
    },
  });
};

export const useUploadEnterpriseDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentType, file }: { documentType: string | number; file: File }) =>
      enterpriseProfileApi.uploadDocument(documentType, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enterpriseProfile", "documents"] });
      queryClient.invalidateQueries({ queryKey: ["enterpriseProfile"] });
    },
  });
};

export const useSetEnterpriseEnvironmentLicense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: SetEnvironmentLicensePayload) => enterpriseProfileApi.setEnvironmentLicense(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enterpriseProfile"] });
      queryClient.invalidateQueries({ queryKey: ["enterpriseProfile", "documents"] });
    },
  });
};

export const useSubmitEnterpriseProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: SubmitEnterpriseProfilePayload) => enterpriseProfileApi.submit(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enterpriseProfile"] });
      queryClient.invalidateQueries({ queryKey: ["enterpriseProfile", "documents"] });
    },
  });
};
