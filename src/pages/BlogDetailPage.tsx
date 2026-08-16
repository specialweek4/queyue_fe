import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import Avatar from "@/components/common/Avatar";
import Thumb from "@/components/common/Thumb";
import Rating from "@/components/common/Rating";
import FollowButton from "@/components/common/FollowButton";
import LikeButton from "@/components/common/LikeButton";
import EmptyState from "@/components/common/EmptyState";
import { blogService } from "@/services/blogService";
import { shopService } from "@/services/shopService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatDateTime } from "@/utils/format";
import { ChatIcon, LocationIcon } from "@/components/icons/Icon";
import type { Blog, Shop, UserDTO } from "@/types";
import styles from "./BlogDetailPage.module.css";

const BlogDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [blog, setBlog] = useState<Blog | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [likes, setLikes] = useState<UserDTO[]>([]);
  const [active, setActive] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const blogId = Number(id);

  const loadBlog = async (targetId: number) => {
    try {
      const data = await blogService.byId(targetId);
      setBlog(data);
      if (data.shopId) {
        shopService
          .byId(data.shopId)
          .then(setShop)
          .catch(() => setShop(null));
      } else {
        setShop(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载笔记失败");
    }
  };

  const loadLikes = async (targetId: number) => {
    try {
      const data = await blogService.likes(targetId);
      setLikes(data ?? []);
    } catch {
      setLikes([]);
    }
  };

  useEffect(() => {
    if (!blogId) return;
    void loadBlog(blogId);
    void loadLikes(blogId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogId]);

  const images = (blog?.images || "").split(",").filter(Boolean);

  const handleCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const width = el.clientWidth || 1;
    setActive(Math.min(images.length - 1, Math.max(0, Math.round(el.scrollLeft / width))));
  };

  const handleLikeChanged = (patch: { liked: number; isLike: boolean }) => {
    setBlog(prev => (prev ? { ...prev, ...patch } : prev));
    void loadLikes(blogId);
  };

  const isSelf = !!user && !!blog && user.id === blog.userId;

  const header = <PageHeader title="笔记详情" back right={<button type="button" className={styles.shareBtn}>···</button>} />;

  return (
    <AppLayout variant="cardless" header={header}>
      {!blog ? (
        <EmptyState icon={<ChatIcon size={28} />} title="笔记不存在" description="该笔记可能已删除" />
      ) : (
        <>
          <section className={styles.card}>
            {images.length > 0 ? (
              <div className={styles.carouselWrap}>
                <div className={styles.carousel} ref={carouselRef} onScroll={handleCarouselScroll}>
                  {images.map((img, i) => (
                    <div key={i} className={styles.slide}>
                      <Thumb src={img} alt={`${blog.title} 图${i + 1}`} kind="blog" className={styles.slideImg} />
                    </div>
                  ))}
                </div>
                {images.length > 1 ? (
                  <div className={styles.dots}>
                    {images.map((_, i) => (
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
              {!isSelf ? <FollowButton userId={blog.userId} /> : null}
            </div>

            {blog.title ? <h2 className={styles.title}>{blog.title}</h2> : null}
            <div className={styles.content} dangerouslySetInnerHTML={{ __html: blog.content || "" }} />

            {shop ? (
              <button type="button" className={styles.shopCard} onClick={() => navigate(`/shop/${shop.id}`)}>
                <div className={styles.shopImgWrap}>
                  <Thumb src={(shop.images || "").split(",")[0]} alt={shop.name} kind="shop" className={styles.shopImg} />
                </div>
                <div className={styles.shopInfo}>
                  <b>{shop.name}</b>
                  <Rating value={(shop.score ?? 0) / 10} size={12} />
                  <span className={styles.shopAvg}>￥{shop.avgPrice}/人</span>
                </div>
                <span className={styles.shopGo}>
                  去看看 <LocationIcon size={13} />
                </span>
              </button>
            ) : null}

            <div className={styles.likeBox}>
              <LikeButton blogId={blog.id} liked={blog.liked} isLike={blog.isLike} size="large" onChanged={handleLikeChanged} />
              <div className={styles.likeList}>
                {likes.slice(0, 8).map(u => (
                  <Avatar key={u.id} src={u.icon} name={u.nickName} size={30} />
                ))}
                <span className={styles.likeCount}>{blog.liked}人点赞</span>
              </div>
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
