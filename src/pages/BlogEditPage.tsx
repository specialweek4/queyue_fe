import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { blogService } from "@/services/blogService";
import { shopService } from "@/services/shopService";
import { uploadService } from "@/services/uploadService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { CameraIcon, CloseIcon, LocationIcon, SearchIcon } from "@/components/icons/Icon";
import type { Shop } from "@/types";
import styles from "./BlogEditPage.module.css";

const BlogEditPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileList, setFileList] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [shopName, setShopName] = useState("");
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [publishing, setPublishing] = useState(false);

  // 登录校验（对应 hmdp 前端 checkLogin 逻辑）
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { state: { from: "/blog/new" } });
    }
  }, [authLoading, user, navigate]);

  const queryShops = async (name?: string) => {
    try {
      const data = await shopService.byName(name ?? shopName);
      setShops(data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "搜索店铺失败");
    }
  };

  const openFileDialog = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        // 本地存储返回相对路径（拼 /imgs 前缀），对象存储返回完整 URL（直接用）
        const path = await uploadService.uploadBlog(file);
        uploaded.push(path.startsWith("http") ? path : `/imgs${path}`);
      }
      setFileList(prev => [...prev, ...uploaded]);
      toast.success(`成功上传 ${uploaded.length} 张图片`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "图片上传失败");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deletePic = async (index: number) => {
    const url = fileList[index];
    const name = url.replace(/^\/imgs/, "");
    try {
      await uploadService.deleteBlog(name);
      setFileList(prev => prev.filter((_, i) => i !== index));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    }
  };

  const submitBlog = async () => {
    if (publishing) return;
    if (fileList.length === 0) {
      toast.error("请至少上传一张照片");
      return;
    }
    if (!title.trim()) {
      toast.error("请填写标题");
      return;
    }
    setPublishing(true);
    try {
      await blogService.save({
        title: title.trim(),
        content: content.trim(),
        images: fileList.join(","),
        shopId: selectedShop?.id
      });
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
      subtitle="分享你的探店体验"
      back
      right={
        <button type="button" className={styles.publishBtn} onClick={() => void submitBlog()} disabled={publishing}>
          {publishing ? "发布中..." : "发布"}
        </button>
      }
    />
  );

  return (
    <AppLayout variant="cardless" header={header}>
      <section className={styles.card}>
        <div className={styles.uploadBox}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className={styles.hiddenInput}
            onChange={event => void handleFileSelected(event)}
          />
          <button type="button" className={styles.uploadBtn} onClick={openFileDialog} disabled={uploading}>
            <CameraIcon size={22} />
            <span>{uploading ? "上传中..." : "上传照片"}</span>
          </button>
          <div className={styles.picList}>
            {fileList.map((url, i) => (
              <div key={url + i} className={styles.picBox}>
                <img src={url} alt={`已选图片${i + 1}`} />
                <button type="button" className={styles.picClose} onClick={() => void deletePic(i)} aria-label="删除图片">
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
          placeholder="最近打卡了什么地方，有什么新奇体验呢？"
          rows={8}
        />

        <div className={styles.divider} />

        <button type="button" className={styles.shopRow} onClick={() => setShowDialog(true)}>
          <span className={styles.shopLabel}>
            <LocationIcon size={15} /> 关联店铺
          </span>
          {selectedShop ? (
            <span className={styles.shopSelected}>{selectedShop.name}</span>
          ) : (
            <span className={styles.shopPlaceholder}>去选择 ›</span>
          )}
        </button>
      </section>

      {showDialog ? (
        <div className={styles.mask} onClick={() => setShowDialog(false)}>
          <div className={styles.dialog} onClick={event => event.stopPropagation()}>
            <div className={styles.dialogHead}>
              <b>关联店铺</b>
              <button type="button" className={styles.dialogClose} onClick={() => setShowDialog(false)}>
                <CloseIcon size={15} />
              </button>
            </div>
            <div className={styles.dialogSearch}>
              <input
                value={shopName}
                onChange={event => setShopName(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter") void queryShops();
                }}
                placeholder="搜索店铺名称"
              />
              <button type="button" onClick={() => void queryShops()}>
                <SearchIcon size={15} />
              </button>
            </div>
            <div className={styles.dialogList}>
              {shops.length === 0 ? (
                <EmptyState title="没有找到店铺" description="换个关键词试试" />
              ) : (
                shops.map(shop => (
                  <button
                    key={shop.id}
                    type="button"
                    className={styles.dialogItem}
                    onClick={() => {
                      setSelectedShop(shop);
                      setShowDialog(false);
                    }}
                  >
                    <b>{shop.name}</b>
                    <span>{shop.area}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
};

export default BlogEditPage;
