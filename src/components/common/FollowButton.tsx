import { useEffect, useState } from "react";
import { followService } from "@/services/followService";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import styles from "./FollowButton.module.css";

type FollowButtonProps = {
  userId: number;
  /** 外部可选初值（后端返回后以查询结果为准） */
  className?: string;
};

/**
 * 关注按钮（对应 hmdp 前端 follow 逻辑：
 * GET /follow/or/not/{id} 查询状态，PUT /follow/{id}/{isFollow} 切换）
 */
const FollowButton = ({ userId, className = "" }: FollowButtonProps) => {
  const toast = useToast();
  const { user, loading } = useAuth();
  const [followed, setFollowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    followService
      .orNot(userId)
      .then(value => {
        if (!cancelled) setFollowed(!!value);
      })
      .catch(() => {
        if (!cancelled) setFollowed(false);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleClick = async () => {
    if (loading || !user) {
      toast.error("请先登录");
      return;
    }
    if (pending) return;
    setPending(true);
    try {
      await followService.follow(userId, !followed);
      setFollowed(!followed);
      toast.success(followed ? "已取消关注" : "已关注");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      className={`${styles.btn} ${followed ? styles.following : ""} ${className}`}
      onClick={handleClick}
      disabled={pending || checking}
    >
      {followed ? "取消关注" : "关注"}
    </button>
  );
};

export default FollowButton;
