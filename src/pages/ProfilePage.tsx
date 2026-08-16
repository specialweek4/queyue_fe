import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import Avatar from "@/components/common/Avatar";
import Thumb from "@/components/common/Thumb";
import LikeButton from "@/components/common/LikeButton";
import EmptyState from "@/components/common/EmptyState";
import { blogService } from "@/services/blogService";
import { userService } from "@/services/userService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { formatDate } from "@/utils/format";
import { AddIcon, ChatIcon, EditIcon, LikeIcon, LogoutIcon, RefreshIcon, StarIcon, UserIcon } from "@/components/icons/Icon";
import type { Blog, SignCount, UserInfo } from "@/types";
import styles from "./ProfilePage.module.css";

type TabKey = "blogs" | "follow";

const ProfilePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, loading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>("blogs");
  const [info, setInfo] = useState<UserInfo | null>(null);

  // 我的笔记
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(false);

  // 关注动态（滚动分页）
  const [feed, setFeed] = useState<Blog[]>([]);
  const [feedOffset, setFeedOffset] = useState(0);
  const [feedLastId, setFeedLastId] = useState(0);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedFinished, setFeedFinished] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // 签到
  const [signToday, setSignToday] = useState(false);
  const [signStreak, setSignStreak] = useState(0);
  const [signMonthDays, setSignMonthDays] = useState(0);
  const [signLoading, setSignLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { state: { from: "/profile" } });
    }
  }, [authLoading, user, navigate]);

  const loadInfo = useCallback(async () => {
    if (!user) return;
    try {
      const data = await userService.info(user.id);
      setInfo(data);
    } catch {
      setInfo(null);
    }
  }, [user]);

  const loadMyBlogs = useCallback(async () => {
    setBlogsLoading(true);
    try {
      const data = await blogService.ofMe(1);
      setBlogs(data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载笔记失败");
    } finally {
      setBlogsLoading(false);
    }
  }, [toast]);

  // 签到状态（today=今日是否已签；streak=连续天数，今日未签时为截至昨天；monthDays=本月累计已签）
  const loadSignCount = useCallback(async () => {
    if (!user) return;
    try {
      const data = await userService.signCount();
      setSignToday(data?.today ?? false);
      setSignStreak(data?.streak ?? 0);
      setSignMonthDays(data?.monthDays ?? 0);
    } catch {
      setSignToday(false);
      setSignStreak(0);
      setSignMonthDays(0);
    }
  }, [user]);

  const handleSign = async () => {
    if (signLoading || signToday) return;
    setSignLoading(true);
    try {
      await userService.sign();
      const data = await userService.signCount();
      setSignToday(data?.today ?? true);
      setSignStreak(data?.streak ?? 1);
      setSignMonthDays(data?.monthDays ?? 1);
      toast.success(`签到成功，已连续签到 ${data?.streak ?? 1} 天`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "签到失败");
    } finally {
      setSignLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    void loadInfo();
    void loadMyBlogs();
    void loadSignCount();
  }, [user, loadInfo, loadMyBlogs, loadSignCount]);

  // 关注动态：clear 时重置滚动分页参数（对应 hmdp 前端 queryBlogsOfFollow 逻辑）
  const loadFeed = useCallback(
    async (clear = false) => {
      if (!user) return;
      if (feedLoading) return;
      setFeedLoading(true);
      try {
        const offset = clear ? 0 : feedOffset;
        const lastId = clear ? Date.now() + 1 : feedLastId || Date.now() + 1;
        const data = await blogService.ofFollow({ offset, lastId });
        if (!data || !data.list || data.list.length === 0) {
          if (clear) setFeed([]);
          setFeedFinished(true);
        } else {
          setFeed(prev => (clear ? data.list : [...prev, ...data.list]));
          setFeedOffset(data.offset ?? 0);
          setFeedLastId(data.minTime ?? 0);
          setFeedFinished(false);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "加载关注动态失败");
      } finally {
        setFeedLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, feedOffset, feedLastId, feedLoading, toast]
  );

  useEffect(() => {
    if (activeTab === "follow" && feed.length === 0) {
      void loadFeed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useInfiniteScroll(null, () => void loadFeed(false), {
    disabled: activeTab !== "follow" || feedLoading || feedFinished
  });

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success("已退出登录");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "退出失败");
    } finally {
      setLoggingOut(false);
    }
  };

  const updateFeedBlog = (id: number, patch: { liked: number; isLike: boolean }) => {
    setFeed(prev => prev.map(b => (b.id === id ? { ...b, ...patch } : b)));
  };

  if (authLoading || !user) {
    return null;
  }

  const stats = [
    { label: "粉丝", value: info?.fans ?? 0, icon: <UserIcon size={15} />, tint: styles.statCyan },
    { label: "关注", value: info?.followee ?? 0, icon: <AddIcon size={15} />, tint: styles.statGreen },
    { label: "积分", value: info?.credits ?? 0, icon: <StarIcon size={15} />, tint: styles.statSky }
  ];

  const header = <PageHeader title="个人主页" subtitle={formatDate(new Date())} />;

  return (
    <AppLayout variant="cardless" header={header}>
      <section className={styles.profileCard}>
        <div className={styles.profileTop}>
          <Avatar src={user.icon} name={user.nickName} size={84} />
          <div className={styles.profileInfo}>
            <h2 className={styles.nickName}>{user.nickName}</h2>
            <span className={styles.city}>{info?.city || "杭州"}</span>
            <p className={styles.introduce}>{info?.introduce || "添加个人简介，让大家更好的认识你"}</p>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.editBtn} onClick={() => navigate("/profile/edit")}>
              <EditIcon size={14} /> 编辑资料
            </button>
            <button type="button" className={styles.logoutBtn} onClick={() => void handleLogout()} disabled={loggingOut}>
              <LogoutIcon size={14} /> {loggingOut ? "退出中..." : "退出登录"}
            </button>
          </div>
        </div>
        <div className={styles.stats}>
          {stats.map(stat => (
            <div key={stat.label} className={styles.statBox}>
              <span className={`${styles.statIcon} ${stat.tint}`}>{stat.icon}</span>
              <b>{stat.value}</b>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.signCard}>
        <div className={styles.signInfo}>
          <div className={styles.signStat}>
            <b className={styles.signDays}>{signStreak}</b>
            <span className={styles.signLabel}>本月连续签到</span>
          </div>
          <div className={styles.signDivider} />
          <div className={styles.signStat}>
            <b className={styles.signDays}>{signMonthDays}</b>
            <span className={styles.signLabel}>本月已签天数</span>
          </div>
        </div>
        <div className={styles.signRight}>
          <button
            type="button"
            className={signToday ? `${styles.signBtn} ${styles.signBtnDone}` : styles.signBtn}
            onClick={() => void handleSign()}
            disabled={signLoading || signToday}
          >
            {signLoading ? "签到中..." : signToday ? "今日已签到" : "签到"}
          </button>
          <span className={styles.signTip}>
            {signToday ? "每日签到，积少成多" : signStreak > 0 ? "今日还未签到，别断签哦" : "每日签到，积少成多"}
          </span>
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
            className={activeTab === "follow" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setActiveTab("follow")}
          >
            关注动态
          </button>
          {activeTab === "follow" ? (
            <button
              type="button"
              className={styles.refreshBtn}
              onClick={() => void loadFeed(true)}
              title="刷新"
              disabled={feedLoading}
            >
              <RefreshIcon size={15} />
            </button>
          ) : null}
        </div>

        {activeTab === "blogs" ? (
          blogsLoading ? (
            <div className={styles.tip}>加载中…</div>
          ) : blogs.length === 0 ? (
            <EmptyState
              icon={<EditIcon size={26} />}
              title="还没有发布笔记"
              description="记录一次探店，分享给更多人"
              action={
                <button type="button" className={styles.goBtn} onClick={() => navigate("/blog/new")}>
                  去发笔记
                </button>
              }
            />
          ) : (
            <div className={styles.blogList}>
              {blogs.map(blog => (
                <button key={blog.id} type="button" className={styles.blogRow} onClick={() => navigate(`/blog/${blog.id}`)}>
                  <div className={styles.blogThumb}>
                    <Thumb src={(blog.images || "").split(",")[0]} alt={blog.title} kind="blog" />
                  </div>
                  <div className={styles.blogBody}>
                    <b className={styles.blogTitle}>{blog.title}</b>
                    <span className={styles.blogMeta}>
                      <LikeIcon size={12} /> {blog.liked}
                      <ChatIcon size={12} /> {blog.comments}
                      <i>{formatDate(blog.createTime)}</i>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : feed.length === 0 && !feedLoading ? (
          <EmptyState
            icon={<UserIcon size={26} />}
            title="还没有关注动态"
            description="去热门笔记看看，关注感兴趣的作者吧"
            action={
              <button type="button" className={styles.goBtn} onClick={() => navigate("/")}>
                去首页逛逛
              </button>
            }
          />
        ) : (
          <div className={styles.feedList}>
            {feed.map(blog => (
              <article key={blog.id} className={styles.feedCard}>
                <button
                  type="button"
                  className={styles.feedImg}
                  onClick={() => navigate(`/blog/${blog.id}`)}
                >
                  <Thumb src={(blog.images || "").split(",")[0]} alt={blog.title} kind="blog" />
                </button>
                <div className={styles.feedBody}>
                  <div className={styles.feedTitle}>{blog.title}</div>
                  <div className={styles.feedFoot}>
                    <button type="button" className={styles.feedAuthor} onClick={() => navigate(`/user/${blog.userId}`)}>
                      <Avatar src={blog.icon} name={blog.name} size={26} />
                      <span>{blog.name || `用户${blog.userId}`}</span>
                    </button>
                    <LikeButton
                      blogId={blog.id}
                      liked={blog.liked}
                      isLike={blog.isLike}
                      onChanged={patch => updateFeedBlog(blog.id, patch)}
                    />
                  </div>
                </div>
              </article>
            ))}
            <div className={styles.tip}>{feedLoading ? "加载中…" : feedFinished ? "— 已经到底啦 —" : ""}</div>
          </div>
        )}
      </section>
    </AppLayout>
  );
};

export default ProfilePage;
