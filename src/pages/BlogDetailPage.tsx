import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import Avatar from "@/components/common/Avatar";
import Thumb from "@/components/common/Thumb";
import FollowButton from "@/components/common/FollowButton";
import LikeButton from "@/components/common/LikeButton";
import EmptyState from "@/components/common/EmptyState";
import { blogService } from "@/services/blogService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatDateTime } from "@/utils/format";
import { ChatIcon } from "@/components/icons/Icon";
import type { Blog } from "@/types";
import styles from "./BlogDetailPage.module.css";

const BlogDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [blog, setBlog] = useState<Blog | null>(null);
  const [contentText, setContentText] = useState("");
  const [active, setActive] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const blogId = Number(id);

  const loadBlog = async (targetId: number) => {
    try {
      const data = await blogService.byId(targetId);
      setBlog(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载笔记失败");
    }
  };

  // 正文存 OSS：详情接口返回 contentUrl，前端拉取文本
  useEffect(() => {
    if (!blog?.contentUrl) {
      setContentText("");
      return;
    }
    let cancelled = false;
    fetch(blog.contentUrl)
      .then(r => (r.ok ? r.text() : Promise.reject(new Error("正文加载失败"))))
      .then(text => {
        if (!cancelled) setContentText(text);
      })
      .catch(() => {
        if (!cancelled) setContentText("");
      });
    return () => {
      cancelled = true;
    };
  }, [blog?.contentUrl]);

  useEffect(() => {
    if (!blogId) return;
    void loadBlog(blogId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogId]);

  const images = (blog?.images || "").split(",").filter(Boolean);
  const displayImages = images.length > 0 ? images : blog?.coverUrl ? [blog.coverUrl] : [];

  const handleCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const width = el.clientWidth || 1;
    setActive(Math.min(displayImages.length - 1, Math.max(0, Math.round(el.scrollLeft / width))));
  };

  // 点赞后重新拉详情：liked/isLike/followed 一起刷新
  const handleLikeChanged = () => {
    void loadBlog(blogId);
  };

  const isSelf = !!user && !!blog && user.id === blog.userId;

  /** 删除笔记（软删除，进回收站，7天内可恢复），仅作者本人可见入口 */
  const handleDelete = async () => {
    if (!blog || deleting) return;
    if (!window.confirm("确定删除这篇笔记吗？删除后进入回收站，7天内可恢复")) return;
    setDeleting(true);
    try {
      await blogService.remove(blog.id);
      toast.success("已移入回收站");
      navigate("/profile", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeleting(false);
    }
  };

  const header = (
    <PageHeader
      title="笔记详情"
      back
      right={
        isSelf ? (
          <button type="button" className={styles.delBtn} onClick={() => void handleDelete()} disabled={deleting}>
            {deleting ? "删除中..." : "删除"}
          </button>
        ) : (
          <button type="button" className={styles.shareBtn}>···</button>
        )
      }
    />
  );

  return (
    <AppLayout variant="cardless" header={header}>
      {!blog ? (
        <EmptyState icon={<ChatIcon size={28} />} title="笔记不存在" description="该笔记可能已删除" />
      ) : (
        <>
          <section className={styles.card}>
            {displayImages.length > 0 ? (
              <div className={styles.carouselWrap}>
                <div className={styles.carousel} ref={carouselRef} onScroll={handleCarouselScroll}>
                  {displayImages.map((img, i) => (
                    <div key={i} className={styles.slide}>
                      <Thumb src={img} alt={`${blog.title} 图${i + 1}`} kind="blog" className={styles.slideImg} />
                    </div>
                  ))}
                </div>
                {displayImages.length > 1 ? (
                  <div className={styles.dots}>
                    {displayImages.map((_, i) => (
                      <span key={i} className={i === active ? `${styles.dot} ${styles.dotActive}` : styles.dot} />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className={styles.authorRow}>
              <button
                type="button"
                className={styles.author}
                onClick={() => navigate(isSelf ? "/profile" : `/user/${blog.userId}`)}
              >
                <Avatar src={blog.icon} name={blog.name} size={46} />
                <span className={styles.authorText}>
                  <b>{blog.name || `用户${blog.userId}`}</b>
                  <i>{formatDateTime(blog.createTime)}</i>
                </span>
              </button>
              {!isSelf ? <FollowButton userId={blog.userId} initial={blog.followed ?? false} /> : null}
            </div>

            {blog.title ? <h2 className={styles.title}>{blog.title}</h2> : null}
            <div className={styles.content}>{contentText}</div>

            <div className={styles.likeBox}>
              <LikeButton blogId={blog.id} liked={blog.liked} isLike={blog.isLike} size="large" onChanged={handleLikeChanged} />
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionTitle}>
              <span className={styles.chatBadge}>
                <ChatIcon size={14} />
              </span>
              <b>评论</b>
            </div>
            <EmptyState
              icon={<ChatIcon size={26} />}
              title="评论区即将开放"
              description="后端评论接口正在建设中，敬请期待"
            />
          </section>
        </>
      )}
    </AppLayout>
  );
};

export default BlogDetailPage;
