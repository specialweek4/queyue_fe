import { apiFetch } from "./apiClient";
import type { UserDTO } from "@/types";

/** 关注相关接口（对应 hmdp 前端约定，后端 FollowController 待实现） */
export const followService = {
  /** 当前用户是否关注了目标用户 */
  orNot: (userId: number) => apiFetch<boolean>(`/follow/or/not/${userId}`),

  /** 关注/取消关注（isFollow=true 关注，false 取消） */
  follow: (userId: number, isFollow: boolean) =>
    apiFetch<void>(`/follow/${userId}/${isFollow}`, {
      method: "PUT"
    }),

  /** 与目标用户的共同关注 */
  common: (userId: number) => apiFetch<UserDTO[]>(`/follow/common/${userId}`)
};
