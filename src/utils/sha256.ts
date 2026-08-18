/**
 * 文本 SHA-256 摘要（Web Crypto 实现，无第三方依赖）
 *
 * 移植自知光前端 knowpostService.ts 的 computeSha256（Web Crypto 实现），
 * 原版对 File 取 arrayBuffer 计算，这里适配为对 UTF-8 文本直接计算，
 * 用于“正文 hash 去重”：保存前与上次保存的 hash 比对，没变就跳过上传。
 *
 * 注意：crypto.subtle 仅在安全上下文（https 或 localhost）可用。
 */
export async function computeSha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
