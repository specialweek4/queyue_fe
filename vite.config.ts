import { defineConfig } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import fs from "node:fs";
import path from "node:path";

const configDir = fileURLToPath(new URL(".", import.meta.url));

/** 本地静态图片目录（前后端共用：后端上传落盘、前端开发服务器读取，均指向工作区 imgs/） */
const IMG_DIRS = [
  path.resolve(configDir, "../imgs")
];

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

/**
 * 开发环境直接提供 /imgs 静态图片（商户类型图标、本地笔记图等），
 * 免去必须启动 nginx(8090)；找不到时再交给 /imgs 代理转发（nginx 兜底）。
 */
function serveLocalImgs(): Plugin {
  return {
    name: "qupingque-serve-imgs",
    configureServer(server) {
      server.middlewares.use("/imgs", (req, res, next) => {
        const urlPath = decodeURIComponent((req.url || "").split("?")[0]).replace(/^\/+/, "");
        const tryDirs = IMG_DIRS.slice();
        const attempt = () => {
          const base = tryDirs.shift();
          if (!base) {
            next();
            return;
          }
          const filePath = path.normalize(path.join(base, urlPath));
          if (!filePath.startsWith(base + path.sep)) {
            attempt();
            return;
          }
          fs.readFile(filePath, (err, data) => {
            if (err) {
              attempt();
              return;
            }
            res.statusCode = 200;
            res.setHeader(
              "Content-Type",
              CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream"
            );
            res.end(data);
          });
        };
        attempt();
      });
    }
  };
}

// 开发服务器：
// - /api            转发到雀跃后端（默认 8081），去掉 /api 前缀（与 nginx 约定一致）
// - /imgs           优先由本地目录直接提供（见上方插件），未命中再转发 nginx(8090)
// - /imgproxy/qcloud 转发外部图片（商户图存于 qcloud.dpfile.com，浏览器直连易被拦截）
export default defineConfig({
  plugins: [react(), serveLocalImgs()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, "")
      },
      "/imgs": {
        target: "http://localhost:8090",
        changeOrigin: true
      },
      "/imgproxy/qcloud": {
        target: "https://qcloud.dpfile.com",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/imgproxy\/qcloud/, "")
      }
    }
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  }
});
