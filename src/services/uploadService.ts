import { apiFetch } from "./apiClient";

/** 图片上传接口（对应 qupingque_be UploadController，本地/对象存储双模式对前端透明） */
export const uploadService = {
  /** 上传笔记图片：本地模式返回相对路径（如 /blogs/a/b/uuid.png，需拼 /imgs 前缀），OSS 模式返回完整 URL */
  uploadBlog: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<string>("/upload/blog", {
      method: "POST",
      body: formData
    });
  },

  /** 删除已上传的笔记图片（name 传存储路径即可，后端按存储模式自行解析） */
  deleteBlog: (name: string) =>
    apiFetch<void>("/upload/blog/delete", {
      params: { name }
    })
};
