import type { User } from "@/contexts/AuthContext";
import { userProfileApi } from "./user-profile.api";
import type { UpdateUserProfilePayload, UserProfile } from "./profile.types";

export type UserProfileMe = UserProfile;

export const userProfileService = {
  getMe: userProfileApi.getMe,
  updateMe: (body: UpdateUserProfilePayload) => userProfileApi.updateMe(body),
  getById: (userId: string) => userProfileApi.getById(userId),
  updateById: (userId: string, body: UpdateUserProfilePayload) => userProfileApi.updateById(userId, body),

  toAuthUser: (profile: UserProfile): User => ({
    id: profile.id,
    email: profile.email,
    name: profile.fullName || profile.email,
    role: profile.role,
    district: profile.districtName ?? profile.wardName ?? undefined,
  }),
};
