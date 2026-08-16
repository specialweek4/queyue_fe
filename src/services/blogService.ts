import { apiFetch } from "./apiClient";
import type { Blog, ScrollResult, UserDTO } from "@/types";

/** 笔记相关接口（对应 qupingque_be BlogController 及约定扩展） */
export const blogService = {
  /** 热门笔记（按点赞数倒序分页） */
  hot: (current = 1) =>
    apiFetch<Blog[]>("/blog/hot", {
      params: { current }
    }),

  /** 我的笔记 */
  ofMe: (current = 1) =>
    apiFetch<Blog[]>("/blog/of/me", {
      params: { current }
    }),

  /** 关注用户笔记（滚动分页，返回 ScrollResult） */
  ofFollow: (params: { offset: number; lastId: number }) =>
    apiFetch<ScrollResult>("/blog/of/follow", { params }),

  /** 指定用户的笔记 */
  ofUser: (userId: number, current = 1) =>
    apiFetch<Blog[]>("/blog/of/user", {
      params: { id: userId, current }
    }),

  /** 查询笔记详情（含 isLike 等当前用户维度字段） */
  byId: (id: number) => apiFetch<Blog>(`/blog/${id}`),

  /** 点赞/取消点赞笔记 */
  like: (id: number) =>
    apiFetch<void>(`/blog/like/${id}`, {
      method: "PUT"
    }),

  /** 笔记点赞用户列表 */
  likes: (id: number) => apiFetch<UserDTO[]>(`/blog/likes/${id}`),

  /** 发布笔记，返回新笔记 id */
  save: (blog: { title: string; content: string; images: string; shopId?: number }) =>
    apiFetch<number>("/blog", {
      method: "POST",
      body: blog
    })
};
