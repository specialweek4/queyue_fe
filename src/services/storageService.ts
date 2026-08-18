import { apiFetch } from "./apiClient";

/** 预签名直传返回信息 */
export type PresignInfo = {
  objectKey: string;
  putUrl: string;
  headers: Record<string, string>;
  expiresIn: number;
};

/** 确认提交后的正式区对象引用 */
export type ConfirmedObject = {
  objectKey: string;
  url: string;
};

/** 确认提交请求（把临时区对象搬入正式区） */
export type ConfirmRequest = {
  postId: string;
  imageKeys: string[];
  coverKey?: string;
  contentKey?: string;
};

/** 确认提交响应 */
export type ConfirmResponse = {
  images: ConfirmedObject[];
  cover?: ConfirmedObject;
  content?: ConfirmedObject;
};

/** OSS 对象存储（预签名直传，文件不经过后端） */
export const storageService = {
  /** 获取预签名 PUT 地址（需先建草稿拿到 postId） */
  presign: (scene: string, postId: string, contentType: string, ext: string) =>
    apiFetch<PresignInfo>("/storage/presign", {
      method: "POST",
      body: { scene, postId, contentType, ext }
    }),

  /** 浏览器直传 OSS（带签名时约定的 headers，如 Content-Type） */
  putObject: async (putUrl: string, blob: Blob, headers?: Record<string, string>) => {
    // 过滤掉 null/undefined 头，避免被序列化成字符串 "null" 导致签名不匹配
    const cleanHeaders: Record<string, string> = {};
    Object.entries(headers ?? {}).forEach(([k, v]) => {
      if (v !== null && v !== undefined) cleanHeaders[k] = v;
    });
    const r = await fetch(putUrl, {
      method: "PUT",
      body: blob,
      headers: cleanHeaders
    });
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      throw new Error(`直传失败(${r.status}) ${body.slice(0, 120)}`);
    }
  },

  /** 确认提交：把临时区（unconfirmed/）对象搬入正式区（blogs/），返回正式引用 */
  confirm: (payload: ConfirmRequest) =>
    apiFetch<ConfirmResponse>("/storage/confirm", {
      method: "POST",
      body: payload
    })
};
