import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import { blogService } from "@/services/blogService";
import { storageService } from "@/services/storageService";
import type { ConfirmResponse } from "@/services/storageService";
import { computeSha256 } from "@/utils/sha256";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { CameraIcon, CloseIcon } from "@/components/icons/Icon";
import styles from "./BlogEditPage.module.css";

type StoredFile = { url: string; objectKey: string };

/** 从公开 URL 反推 OSS objectKey（回填编辑时用） */
const urlToKey = (url: string) => url.replace(/^https?:\/\/[^/]+\//, "");

/** 从预签名 URL 去掉签名参数得到公开访问 URL */
const publicUrlOf = (putUrl: string) => putUrl.split("?")[0];

const BlogEditPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();

  const editId = Number(searchParams.get("id") || 0);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [blogId, setBlogId] = useState<number | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [cover, setCover] = useState<StoredFile | null>(null);
  const [picList, setPicList] = useState<StoredFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  // 上次确认后的正文正式区 key（blogs/ 前缀）；仅在 confirm 成功后更新
  const [confirmedContentKey, setConfirmedContentKey] = useState<string | undefined>(undefined);
  // 上次成功保存时的正文 SHA-256；加载草稿时用已保存正文做种子，避免首存就重传
  const lastContentHashRef = useRef<string | null>(null);

  // 登录校验
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { state: { from: `/blog/new${editId ? `?id=${editId}` : ""}` } });
    }
  }, [authLoading, user, navigate, editId]);

  // 进入页面：仅编辑模式加载草稿；新建模式不做任何事（懒创建）
  useEffect(() => {
    if (authLoading || !user) return;
    if (!editId) return;
    setLoadingDraft(true);
    (async () => {
      try {
        const draft = await blogService.byId(editId);
        setBlogId(draft.id);
        setTitle(draft.title || "");
        setCover(draft.coverUrl ? { url: draft.coverUrl, objectKey: urlToKey(draft.coverUrl) } : null);
        setPicList(
          (draft.images || "")
            .split(",")
            .filter(Boolean)
            .map(url => ({ url, objectKey: urlToKey(url) }))
        );
        if (draft.contentUrl) {
          try {
            const text = await fetch(draft.contentUrl).then(r => {
              if (!r.ok) throw new Error(`HTTP ${r.status}`);
              return r.text();
            });
            setContent(text);
            // 加载出来的正文即上次保存的内容，用它的 hash 做种子：
            // 打开草稿只改标题/图片就保存时，正文未变直接跳过上传
            lastContentHashRef.current = await computeSha256(text);
          } catch {
            setContent("");
          }
        }
        // 沿用库里已确认的正文 key（blogs/ 前缀），正文没变时直接复用它
        setConfirmedContentKey(draft.contentObjectKey);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "加载草稿失败");
        navigate("/profile");
      } finally {
        setLoadingDraft(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  /** 懒创建：第一次上传/保存时才建空草稿，返回可用的 blogId */
  const ensureDraft = async (): Promise<number> => {
    if (blogId) return blogId;
    const id = await blogService.saveDraft({});
    setBlogId(id);
    return id;
  };

  /** 上传一个文件到 OSS 临时区（unconfirmed/）：签名 → 直传 → 返回 {url, objectKey} */
  const uploadFile = async (file: File, scene: "blog_cover" | "blog_image"): Promise<StoredFile> => {
    const id = await ensureDraft();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const p = await storageService.presign(scene, String(id), file.type || "image/jpeg", ext);
    await storageService.putObject(p.putUrl, file, p.headers);
    return { url: publicUrlOf(p.putUrl), objectKey: p.objectKey };
  };

  /** 上传正文文本到 OSS 临时区，返回临时 objectKey（空文本返回 undefined） */
  const uploadContent = async (text: string, id: number): Promise<string | undefined> => {
    if (!text.trim()) return undefined;
    const p = await storageService.presign("blog_content", String(id), "text/markdown", "md");
    const blob = new Blob([text], { type: "text/markdown" });
    await storageService.putObject(p.putUrl, blob, p.headers);
    return p.objectKey;
  };

  const handleCoverSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || uploading) return;
    setUploading(true);
    try {
      const stored = await uploadFile(file, "blog_cover");
      // 纯流派 A：换封面只改本地引用，旧文件成为 blogs/ 孤儿，交给未来的差集 GC 清理
      setCover(stored);
      toast.success("封面已更新");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "封面上传失败");
    } finally {
      setUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const handleFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0 || uploading) return;
    setUploading(true);
    try {
      const uploaded: StoredFile[] = [];
      for (const file of files) {
        uploaded.push(await uploadFile(file, "blog_image"));
      }
      setPicList(prev => [...prev, ...uploaded]);
      toast.success(`成功上传 ${uploaded.length} 张图片`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "图片上传失败");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /** 删除图片：只移除本地引用，不删 OSS（未提交的由生命周期回收，已提交的由差集 GC 回收） */
  const deletePic = (index: number) => {
    setPicList(prev => prev.filter((_, i) => i !== index));
  };

  /** 删除封面：只移除本地引用，不删 OSS */
  const deleteCover = () => {
    setCover(null);
  };

  /**
   * 确认提交并组装载荷（流派 A，增量版）：
   * - 正文 hash 去重：保存前对正文算 SHA-256，与上次保存的 hash 相同则跳过直传，
   *   沿用已确认的正文 key；
   * - confirm 增量：只把 unconfirmed/ 临时区新对象传给后端搬入正式区（blogs/），
   *   已是 blogs/ 的正式区引用后端天然幂等，不再重复提交；
   * - 本地状态只替换本次真正搬移的部分，避免临时 URL 留在页面上（生命周期到期会裂图）。
   */
  const buildPayload = async (id: number) => {
    // —— 正文：先算 hash 决定要不要重新直传 ——
    const contentHash = await computeSha256(content);
    let nextContentKey: string | undefined;
    if (!content.trim()) {
      // 空正文没有正文对象（沿用旧行为：contentObjectKey 传空，由后端落库策略处理）
      nextContentKey = undefined;
    } else if (confirmedContentKey && contentHash === lastContentHashRef.current) {
      // 正文没变：跳过直传，复用上次确认的正式区 key
      nextContentKey = confirmedContentKey;
    } else {
      // 正文有变化（或首次保存）：直传到临时区
      nextContentKey = await uploadContent(content, id);
    }

    // —— confirm 增量：只有 unconfirmed/ 前缀才是新对象，其余是上次确认过的正式区引用 ——
    const newImageKeys = picList.filter(p => p.objectKey.startsWith("unconfirmed/")).map(p => p.objectKey);
    const newCoverKey = cover && cover.objectKey.startsWith("unconfirmed/") ? cover.objectKey : undefined;
    const newContentKey = nextContentKey && nextContentKey.startsWith("unconfirmed/") ? nextContentKey : undefined;

    let confirmed: ConfirmResponse | null = null;
    if (newImageKeys.length || newCoverKey || newContentKey) {
      confirmed = await storageService.confirm({
        postId: String(id),
        imageKeys: newImageKeys,
        coverKey: newCoverKey,
        contentKey: newContentKey
      });
    }

    // 本地状态换成正式区引用：只替换本次搬移的部分，其余保持原样
    let confirmedIndex = 0;
    const mergedImages = picList.map(item => {
      if (!item.objectKey.startsWith("unconfirmed/")) return item;
      const co = confirmed?.images[confirmedIndex++];
      return co ? { url: co.url, objectKey: co.objectKey } : item;
    });
    const mergedCover =
      newCoverKey && confirmed?.cover ? { url: confirmed.cover.url, objectKey: confirmed.cover.objectKey } : cover;
    const finalContentKey = newContentKey && confirmed?.content ? confirmed.content.objectKey : nextContentKey;

    setPicList(mergedImages);
    setCover(mergedCover);
    setConfirmedContentKey(finalContentKey);
    lastContentHashRef.current = contentHash;

    return {
      id,
      title: title.trim(),
      images: mergedImages.map(c => c.url).join(","),
      // 封面传空串才能清掉数据库里的旧值（null 会被 MP 跳过导致旧 URL 残留）
      coverUrl: mergedCover?.url ?? "",
      contentObjectKey: finalContentKey,
      contentText: content.trim()
    };
  };

  /** 保存草稿：留在本页继续编辑（未建草稿时先懒创建） */
  const saveDraft = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const id = await ensureDraft();
      await blogService.saveDraft(await buildPayload(id));
      toast.success("草稿已保存");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存草稿失败");
    } finally {
      setSaving(false);
    }
  };

  /** 发布：先落最新内容，再改状态（未建草稿时先懒创建） */
  const publish = async () => {
    if (publishing) return;
    if (!title.trim()) {
      toast.error("请填写标题");
      return;
    }
    setPublishing(true);
    try {
      const id = await ensureDraft();
      await blogService.saveDraft(await buildPayload(id));
      await blogService.publish(id);
      toast.success("发布成功");
      navigate("/profile");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "发布失败");
    } finally {
      setPublishing(false);
    }
  };

  const header = (
    <PageHeader
      title="发笔记"
      subtitle="分享你的生活与知识"
      back
      right={
        <div className={styles.headerBtns}>
          <button type="button" className={styles.draftBtn} onClick={() => void saveDraft()} disabled={saving || publishing}>
            {saving ? "保存中..." : "保存草稿"}
          </button>
          <button type="button" className={styles.publishBtn} onClick={() => void publish()} disabled={publishing || saving}>
            {publishing ? "发布中..." : "发布"}
          </button>
        </div>
      }
    />
  );

  return (
    <AppLayout variant="cardless" header={header}>
      <section className={styles.card}>
        {loadingDraft ? <div className={styles.loadingTip}>草稿加载中…</div> : null}

        {/* 封面 */}
        <div className={styles.coverRow}>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={event => void handleCoverSelected(event)}
          />
          <button type="button" className={styles.coverBtn} onClick={() => coverInputRef.current?.click()} disabled={uploading}>
            <CameraIcon size={20} />
            <span>{uploading && !cover ? "上传中..." : "上传封面"}</span>
          </button>
          {cover ? (
            <div className={styles.coverBox}>
              <img src={cover.url} alt="封面" />
              <button type="button" className={styles.picClose} onClick={() => deleteCover()} aria-label="删除封面">
                <CloseIcon size={12} />
              </button>
            </div>
          ) : (
            <span className={styles.coverTip}>封面会展示在推荐列表</span>
          )}
        </div>

        {/* 图片 */}
        <div className={styles.uploadBox}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className={styles.hiddenInput}
            onChange={event => void handleFilesSelected(event)}
          />
          <button type="button" className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <CameraIcon size={22} />
            <span>{uploading ? "上传中..." : "上传照片"}</span>
          </button>
          <div className={styles.picList}>
            {picList.map((item, i) => (
              <div key={item.url + i} className={styles.picBox}>
                <img src={item.url} alt={`已选图片${i + 1}`} />
                <button type="button" className={styles.picClose} onClick={() => deletePic(i)} aria-label="删除图片">
                  <CloseIcon size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <input
          className={styles.titleInput}
          value={title}
          onChange={event => setTitle(event.target.value)}
          placeholder="填写标题更容易上首页哦~"
          maxLength={60}
        />
        <textarea
          className={styles.contentInput}
          value={content}
          onChange={event => setContent(event.target.value)}
          placeholder="分享你的生活、知识或探店体验…"
          rows={8}
        />
      </section>
    </AppLayout>
  );
};

export default BlogEditPage;
