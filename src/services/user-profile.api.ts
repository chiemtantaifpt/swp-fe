import api from "./api";
import { unwrapBaseResponse } from "./baseResponse";
import type { ProfileBaseResponse, UpdateUserProfilePayload, UserProfile } from "./profile.types";

export const userProfileApi = {
  getMe: async (): Promise<UserProfile> => {
    const response = await api.get<ProfileBaseResponse<UserProfile>>("/user-profile/me");
    return unwrapBaseResponse(response.data);
  },

  updateMe: async (body: UpdateUserProfilePayload): Promise<UserProfile> => {
    const response = await api.put<ProfileBaseResponse<UserProfile>>("/user-profile/me", body);
    return unwrapBaseResponse(response.data);
  },

  getById: async (userId: string): Promise<UserProfile> => {
    const response = await api.get<ProfileBaseResponse<UserProfile>>(`/user-profile/${userId}`);
    return unwrapBaseResponse(response.data);
  },

  updateById: async (userId: string, body: UpdateUserProfilePayload): Promise<UserProfile> => {
    const response = await api.put<ProfileBaseResponse<UserProfile>>(`/user-profile/${userId}`, body);
    return unwrapBaseResponse(response.data);
  },
};
