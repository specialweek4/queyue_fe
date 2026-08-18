import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import Avatar from "@/components/common/Avatar";
import Thumb from "@/components/common/Thumb";
import FollowButton from "@/components/common/FollowButton";
import EmptyState from "@/components/common/EmptyState";
import { userService } from "@/services/userService";
import { blogService } from "@/services/blogService";
import { followService } from "@/services/followService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatDate } from "@/utils/format";
import { ChatIcon, LikeIcon, UserIcon } from "@/components/icons/Icon";
import type { Blog, User, UserDTO, UserInfo } from "@/types";
import styles from "./UserPage.module.css";

type TabKey = "blogs" | "common";

const UserPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user: me } = useAuth();

  const userId = Number(id);

  const [user, setUser] = useState<User | null>(null);
  const [info, setInfo] = useState<UserInfo | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [commonFollows, setCommonFollows] = useState<UserDTO[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("blogs");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    userService
      .byId(userId)
      .then(data => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });

    userService
      .info(userId)
      .then(data => {
        if (!cancelled) setInfo(data);
      })
      .catch(() => {
        if (!cancelled) setInfo(null);
      });

    blogService
      .ofUser(userId, 1)
      .then(data => {
        if (!cancelled) setBlogs(data ?? []);
      })
      .catch(() => {
        if (!cancelled) setBlogs([]);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const loadCommonFollows = async () => {
    try {
      const data = await followService.common(userId);
      setCommonFollows(data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载共同关注失败");
    }
  };

  useEffect(() => {
    if (activeTab === "common") {
      void loadCommonFollows();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const isSelf = !!me && me.id === userId;
  const displayName = user?.nickName || `用户${userId}`;

  const header = <PageHeader title="个人主页" back />;

  if (notFound) {
    return (
      <AppLayout variant="cardless" header={header}>
        <EmptyState icon={<UserIcon size={28} />} title="用户不存在" description="该用户可能已注销" />
      </AppLayout>
    );
  }

  return (
    <AppLayout variant="cardless" header={header}>
      <section className={styles.profileCard}>
        <div className={styles.profileTop}>
          <Avatar src={user?.icon} name={displayName} size={84} />
          <div className={styles.profileInfo}>
            <h2 className={styles.nickName}>{displayName}</h2>
            <span className={styles.city}>{info?.city || "杭州"}</span>
            <p className={styles.introduce}>{info?.introduce || "这个人很懒，什么都没有留下"}</p>
          </div>
          {!isSelf ? <FollowButton userId={userId} /> : null}
        </div>
        <div className={styles.stats}>
          <div className={styles.statBox}>
            <b>{info?.fans ?? 0}</b>
            <span>粉丝</span>
          </div>
          <div className={styles.statBox}>
            <b>{info?.followee ?? 0}</b>
            <span>关注</span>
          </div>
        </div>
      </section>

      <section className={styles.contentCard}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={activeTab === "blogs" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setActiveTab("blogs")}
          >
            笔记
          </button>
          <button
            type="button"
            className={activeTab === "common" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setActiveTab("common")}
          >
            共同关注
          </button>
        </div>

        {activeTab === "blogs" ? (
          blogs.length === 0 ? (
            <EmptyState icon={<ChatIcon size={26} />} title="还没有发布笔记" description="这位雀友还没有分享探店体验" />
          ) : (
            <div className={styles.blogGrid}>
              {blogs.map(blog => (
                <article key={blog.id} className={styles.blogCard} onClick={() => navigate(`/blog/${blog.id}`)}>
                  <div className={styles.blogImg}>
                    <Thumb src={blog.coverUrl || (blog.images || "").split(",")[0]} alt={blog.title} kind="blog" />
                  </div>
                  <div className={styles.blogBody}>
                    <b>{blog.title}</b>
                    <span className={styles.blogMeta}>
                      <LikeIcon size={12} /> {blog.liked}
                      <ChatIcon size={12} /> {blog.comments}
                      <i>{formatDate(blog.createTime)}</i>
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : commonFollows.length === 0 ? (
          <EmptyState icon={<UserIcon size={26} />} title="暂无共同关注" description="你们还没有共同关注的雀友" />
        ) : (
          <div className={styles.followList}>
            {commonFollows.map(u => (
              <button key={u.id} type="button" className={styles.followRow} onClick={() => navigate(`/user/${u.id}`)}>
                <Avatar src={u.icon} name={u.nickName} size={44} />
                <b>{u.nickName}</b>
                <span className={styles.visit}>去主页看看</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
};

export default UserPage;
