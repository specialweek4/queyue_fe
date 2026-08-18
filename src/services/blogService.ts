import { apiFetch } from "./apiClient";
import type { Blog, ScrollResult } from "@/types";

/** 笔记提交载荷（正文文本仅用于后端生成摘要，不落库） */
export type BlogPayload = {
  id?: number;
  title?: string;
  description?: string;
  images?: string;
  coverUrl?: string;
  contentObjectKey?: string;
  contentText?: string;
};

/** 笔记相关接口（对应 queyue_be BlogController） */
export const blogService = {
  /** 热门笔记（按点赞数倒序分页） */
  hot: (current = 1) =>
    apiFetch<Blog[]>("/blog/hot", {
      params: { current }
    }),

  /** 我的笔记（草稿+已发布） */
  ofMe: (current = 1) =>
    apiFetch<Blog[]>("/blog/of/me", {
      params: { current }
    }),

  /** 关注用户笔记（滚动分页，返回 ScrollResult） */
  ofFollow: (params: { offset: number; lastId: number }) =>
    apiFetch<ScrollResult>("/blog/of/follow", { params }),

  /** 指定用户的笔记（仅已发布） */
  ofUser: (userId: number, current = 1) =>
    apiFetch<Blog[]>("/blog/of/user", {
      params: { id: userId, current }
    }),

  /** 查询笔记详情（含 contentUrl，草稿仅作者可见） */
  byId: (id: number) => apiFetch<Blog>(`/blog/detail/${id}`),

  /** 点赞/取消点赞笔记 */
  like: (id: number) =>
    apiFetch<void>(`/blog/like/${id}`, {
      method: "PUT"
    }),

  /** 保存草稿：无 id 新建并返回 id；有 id 更新（需为作者本人） */
  saveDraft: (blog: BlogPayload) =>
    apiFetch<number>("/blog/draft", {
      method: "POST",
      body: blog
    }),

  /** 草稿转发布（只改状态） */
  publish: (id: number) =>
    apiFetch<void>(`/blog/${id}/publish`, {
      method: "PUT"
    }),

  /** 删除笔记（软删除：status=2 进回收站，7天内可恢复） */
  remove: (id: number) =>
    apiFetch<void>(`/blog/${id}`, {
      method: "DELETE"
    }),

  /** 直接发布（新建，status=1） */
  save: (blog: BlogPayload) =>
    apiFetch<number>("/blog", {
      method: "POST",
      body: blog
    })
};
