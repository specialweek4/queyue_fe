# 趣评雀（qupingque_fe）

本地生活点评与探店笔记分享平台前端，功能与接口调用约定完全对齐 hmdp（黑马点评）前端，
使用 zhiguang_fe-main 的 React 18 + Vite 5 + TypeScript 技术栈重构，
主题色为「焦糖 + 奶油白 + 蜜金」。

## 技术栈

| 类别 | 方案 |
| ---- | ---- |
| 框架 | React 18 + TypeScript 5 |
| 构建 | Vite 5（`@` 别名指向 `src`） |
| 路由 | react-router-dom v6 |
| 样式 | 原生 CSS Modules + CSS 变量主题（无需 UI 组件库） |
| 网络 | 原生 fetch 封装（沿用 hmdp 的 axios 调用约定） |

## 快速开始

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 类型检查 + 产物构建（dist/）
npm run preview    # 本地预览构建产物
```

## 接口调用约定（对齐 hmdp 前端 common.js）

- 基地址 `/api`，开发环境由 Vite 代理到 `http://localhost:8081`（趣评雀后端），
  生产环境由 nginx 将 `/api` 转发到 `8081`（见 `nginx-1.18.0/html/qupingque/qupingque-nginx.conf.example`）；
- token 保存于 `sessionStorage("token")`，请求头 `authorization` 携带；
- 后端统一返回 `Result{success, errorMsg, data, total}`：
  `success=false` 时以 `errorMsg` 提示，`success=true` 时直接使用 `data`；
- HTTP 401 视为未登录：清除 token 并跳转 `/login`；
- 查询参数序列化时跳过空值（hmdp `paramsSerializer` 约定）；
- 上传图片：`POST /upload/blog`（FormData，字段 `file`），返回相对路径后前端拼接 `/imgs` 前缀展示；
  删除图片：`GET /upload/blog/delete?name=xxx`（不含 `/imgs` 前缀）。
- 开发环境图片：`/imgs/*` 由 Vite 直接从工作区共用目录 `D:\queping\imgs` 读取（后端上传也落盘到该目录，
  前端后端共用，无需启动 nginx）；数据库中外部图片（qcloud.dpfile.com）自动经 `/imgproxy/qcloud` 代理转发，避免浏览器直连被拦截。

## 页面与功能（对应 hmdp 页面）

| 路由 | hmdp 对应页面 | 功能 |
| ---- | ------------- | ---- |
| `/` | index.html | 热门笔记瀑布流（无限滚动）、点赞、搜索 |
| `/login` | login.html / login2.html | 验证码登录 + 密码登录（60s 倒计时、协议勾选） |
| `/shops` | shop-list.html | 发现附近好店横幅、店铺分类宫格、距离/人气/评分排序、无限滚动 |
| `/shop/:id` | shop-detail.html | 店铺信息、图片、营业时间、代金券/秒杀抢购、示例评价 |
| `/blog/:id` | blog-detail.html | 图片轮播、作者信息与关注、点赞列表、关联店铺卡片、评论占位 |
| `/blog/new` | blog-edit.html | 多图上传/删除、标题正文、搜索并关联店铺、发布笔记 |
| `/messages` | （新增） | 消息中心（后端暂无消息接口，占位页） |
| `/profile` | info.html | 我的信息、粉丝/关注/积分、我的笔记、关注动态滚动分页、退出登录 |
| `/profile/edit` | info-edit.html | 头像上传、昵称、介绍、性别、城市、生日 |
| `/user/:id` | other-info.html | 他人主页、关注/取消关注、TA 的笔记、共同关注 |

## 后端接口清单（qupingque_be）

已实现并直接对接：

- `GET /shop-type/list`、`GET /shop/{id}`、`GET /shop/of/type`、`GET /shop/of/name`
- `POST /blog`、`PUT /blog/like/{id}`、`GET /blog/of/me`、`GET /blog/hot`
- `GET /voucher/list/{shopId}`、`POST /voucher-order/seckill/{id}`
- `POST /user/code`、`POST /user/login`、`GET /user/me`、`GET /user/info/{id}`
- `POST /upload/blog`、`GET /upload/blog/delete`

沿用 hmdp 前端约定、待后端补全（当前调用失败时前端优雅降级并提示）：

- `GET /blog/{id}`、`GET /blog/likes/{id}`、`GET /blog/of/follow`、`GET /blog/of/user`
- `GET /follow/or/not/{id}`、`PUT /follow/{id}/{isFollow}`、`GET /follow/common/{id}`
- `GET /user/{id}`、`PUT /user-info`（资料编辑保存）
- 评论相关：`GET /blog-comments/{blogId}`、`POST /blog-comments`

## 目录结构

```
src/
├── components/
│   ├── icons/         # 内联 SVG 图标（含趣评雀品牌图标）
│   ├── layout/        # Sidebar / AppLayout / PageHeader
│   └── common/        # Avatar / Thumb / Rating / LikeButton / FollowButton / SearchBar / EmptyState
├── context/           # AuthContext（token+登录态）/ ToastContext（全局提示）
├── hooks/             # useInfiniteScroll（触底加载）
├── pages/             # 9 个页面（见上表）
├── services/          # apiClient + 各业务 service（严格对齐 hmdp 接口）
├── theme/             # 主题色板（青色/白色/黄色）
├── types/             # 与后端实体对齐的类型定义
├── utils/             # formatPrice / formatDistance 等工具（沿用 hmdp util）
├── App.tsx / main.tsx
└── index.css          # CSS 变量与全局样式
```

## 主题色

| 名称 | 色值 | 用途 |
| ---- | ---- | ---- |
| 焦糖 | `#9a6136` / `#7a4a26` | 主色（品牌、侧边栏、主按钮、选中态） |
| 奶油白 | `#ffffff` / `#faf5ec` | 卡片与内容底色 |
| 蜜金 | `#fbbf24` / `#ffd34d` | 辅助色（星级、价格、高亮徽章、强调按钮，深色文字搭配） |

背景采用焦糖与蜜金的光晕叠加在奶油白基底上，整体延续知光（zhiguang）的左侧边栏 + 白色圆角卡片设计语言。
