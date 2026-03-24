import api from "./api";
import { unwrapBaseResponse } from "./baseResponse";
import type {
  EnterpriseDocument,
  EnterpriseProfile,
  ProfileBaseResponse,
  SetEnvironmentLicensePayload,
  SubmitEnterpriseProfilePayload,
  SubmitEnterpriseProfileResult,
  UpsertEnterpriseProfilePayload,
} from "./profile.types";

const unwrapDocumentsResponse = (
  payload: ProfileBaseResponse<EnterpriseDocument[]> | EnterpriseDocument[]
): EnterpriseDocument[] => {
  if (Array.isArray(payload)) return payload;
  return unwrapBaseResponse(payload);
};

export const enterpriseProfileApi = {
  getMe: async (): Promise<EnterpriseProfile | null> => {
    const response = await api.get<ProfileBaseResponse<EnterpriseProfile | null>>("/recycling-enterprises/me/profile");
    return unwrapBaseResponse(response.data);
  },

  upsertMe: async (body: UpsertEnterpriseProfilePayload): Promise<EnterpriseProfile> => {
    const response = await api.post<ProfileBaseResponse<EnterpriseProfile>>("/recycling-enterprises/me/profile", body);
    return unwrapBaseResponse(response.data);
  },

  getDocuments: async (): Promise<EnterpriseDocument[]> => {
    const response = await api.get<ProfileBaseResponse<EnterpriseDocument[]> | EnterpriseDocument[]>(
      "/recycling-enterprises/me/documents"
    );
    return unwrapDocumentsResponse(response.data);
  },

  uploadDocument: async (documentType: string | number, file: File): Promise<EnterpriseDocument> => {
    const formData = new FormData();
    formData.append("documentType", String(documentType));
    formData.append("file", file);

    const response = await api.post<ProfileBaseResponse<EnterpriseDocument>>(
      "/recycling-enterprises/me/documents",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return unwrapBaseResponse(response.data);
  },

  setEnvironmentLicense: async (body: SetEnvironmentLicensePayload): Promise<EnterpriseProfile> => {
    const response = await api.put<ProfileBaseResponse<EnterpriseProfile>>(
      "/recycling-enterprises/me/environment-license",
      body
    );
    return unwrapBaseResponse(response.data);
  },

  submit: async (body: SubmitEnterpriseProfilePayload): Promise<SubmitEnterpriseProfileResult> => {
    const response = await api.post<ProfileBaseResponse<SubmitEnterpriseProfileResult>>(
      "/recycling-enterprises/me/submit",
      body
    );
    return unwrapBaseResponse(response.data);
  },
};
