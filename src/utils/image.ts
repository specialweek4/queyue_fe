/**
 * 图片地址解析
 * - 以 / 开头的本地路径（/imgs/...）：由开发服务器直接提供，原样返回
 * - 开发环境下外部图片（如 qcloud.dpfile.com 店铺图）：改为经 Vite 代理转发，
 *   避免浏览器直连被网络策略拦截
 * - 生产环境：原样返回（由 nginx/浏览器直接访问）
 */
export function resolveImgUrl(src?: string | null): string {
  if (!src) return "";
  if (src.startsWith("/")) return src;
  if (src.startsWith("http") && import.meta.env.DEV) {
    // 仅 qcloud.dpfile.com 的图片改走开发代理；其他外部地址（如自有 OSS）原样直连
    const match = src.match(/^https?:\/\/qcloud\.dpfile\.com/);
    if (match) return "/imgproxy/qcloud" + src.replace(match[0], "");
  }
  return src;
}
