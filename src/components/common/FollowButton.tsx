import { useEffect, useState } from "react";
import { followService } from "@/services/followService";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import styles from "./FollowButton.module.css";

type FollowButtonProps = {
  userId: number;
  /** 外部传入的初值（如详情接口返回的 followed）；传入后不再调 /follow/or/not 探测 */
  initial?: boolean;
  className?: string;
};

/**
 * 关注按钮：有 initial 初值时直接使用（详情接口已返回关注状态），
 * 否则调 GET /follow/or/not/{id} 探测；切换时 PUT /follow/{id}/{isFollow}
 */
const FollowButton = ({ userId, initial, className = "" }: FollowButtonProps) => {
  const toast = useToast();
  const { user, loading } = useAuth();
  const [followed, setFollowed] = useState(!!initial);
  const [checking, setChecking] = useState(initial === undefined);
  const [pending, setPending] = useState(false);

  // 无初值才探测（游客静默降级为未关注）
  useEffect(() => {
    if (initial !== undefined) {
      setFollowed(!!initial);
      return;
    }
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
  }, [userId, initial]);

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
