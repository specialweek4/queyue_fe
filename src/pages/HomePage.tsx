import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import SearchBar from "@/components/common/SearchBar";
import Avatar from "@/components/common/Avatar";
import Thumb from "@/components/common/Thumb";
import LikeButton from "@/components/common/LikeButton";
import EmptyState from "@/components/common/EmptyState";
import { blogService } from "@/services/blogService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { BirdIcon, RefreshIcon } from "@/components/icons/Icon";
import type { Blog } from "@/types";
import styles from "./HomePage.module.css";

const HomePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [current, setCurrent] = useState(1);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const loadingRef = useRef(false);

  // 查询热门笔记（/blog/hot?current=n）
  const loadMore = useCallback(async () => {
    if (loadingRef.current || finished) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await blogService.hot(current);
      if (!data || data.length === 0) {
        setFinished(true);
      } else {
        setBlogs(prev => [...prev, ...data]);
        setCurrent(prev => prev + 1);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载笔记失败");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [current, finished, toast]);

  useEffect(() => {
    void loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useInfiniteScroll(null, loadMore, { disabled: loading || finished });

  const updateBlog = (id: number, patch: { liked: number; isLike: boolean }) => {
    setBlogs(prev => prev.map(b => (b.id === id ? { ...b, ...patch } : b)));
  };

  const handleUserClick = () => {
    if (!authLoading && !user) {
      navigate("/login", { state: { from: "/" } });
    } else {
      navigate("/profile");
    }
  };

  const header = (
    <div className={styles.topBar}>
      <button type="button" className={styles.brand} onClick={() => navigate("/")}>
        <span className={styles.brandLogo}>
          <BirdIcon size={26} />
        </span>
        <span className={styles.brandText}>
          <b>趣评雀</b>
          <i>沉寂已久的心情，掀起了雀跃</i>
        </span>
      </button>
      <SearchBar className={styles.search} placeholder="搜你想看的" />
      <button type="button" className={styles.userBadge} onClick={handleUserClick}>
        <Avatar src={user?.icon} name={user?.nickName} size={40} />
        <span className={styles.userName}>{user ? user.nickName : "登录 / 注册"}</span>
      </button>
    </div>
  );

  return (
    <AppLayout header={header}>
      <section>
        <div className={styles.sectionHead}>
          <h3>热门笔记</h3>
          <span className={styles.sectionNote}>按点赞数推荐</span>
          <button type="button" className={styles.refreshBtn} onClick={() => void loadMore()} title="刷新">
            <RefreshIcon size={16} />
          </button>
        </div>
        {blogs.length === 0 && !loading ? (
          <EmptyState title="还没有热门笔记" description="快去发布第一篇探店笔记吧" />
        ) : (
          <div className={styles.waterfall}>
            {blogs.map(blog => (
              <article key={blog.id} className={styles.card}>
                <button
                  type="button"
                  className={styles.cardImg}
                  onClick={() => navigate(`/blog/${blog.id}`)}
                >
                  <Thumb src={blog.images.split(",")[0]} alt={blog.title} kind="blog" />
                </button>
                <div className={styles.cardBody}>
                  <div className={styles.cardTitle} title={blog.title}>
                    {blog.title}
                  </div>
                  <div className={styles.cardFoot}>
                    <button
                      type="button"
                      className={styles.author}
                      onClick={() => navigate(`/user/${blog.userId}`)}
                    >
                      <Avatar src={blog.icon} name={blog.name} size={26} />
                      <span>{blog.name || `用户${blog.userId}`}</span>
                    </button>
                    <LikeButton
                      blogId={blog.id}
                      liked={blog.liked}
                      isLike={blog.isLike}
                      onChanged={patch => updateBlog(blog.id, patch)}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <div className={styles.loadingRow}>
          {loading ? <span className={styles.loading}>加载中…</span> : null}
          {finished && blogs.length > 0 ? <span className={styles.finished}>— 已经到底啦 —</span> : null}
        </div>
      </section>
    </AppLayout>
  );
};

export default HomePage;
