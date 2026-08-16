import { useState } from "react";
import { blogService } from "@/services/blogService";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { LikeIcon } from "@/components/icons/Icon";
import styles from "./LikeButton.module.css";

type LikeButtonProps = {
  blogId: number;
  liked: number;
  isLike?: boolean;
  size?: "small" | "large";
  onChanged?: (blog: { liked: number; isLike: boolean }) => void;
};

/**
 * 点赞按钮（对应 hmdp 前端 addLike 逻辑：
 * PUT /blog/like/{id} 后重新查询笔记，回写 liked 与 isLike）
 */
const LikeButton = ({ blogId, liked, isLike = false, size = "small", onChanged }: LikeButtonProps) => {
  const toast = useToast();
  const { user, loading } = useAuth();
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    if (loading || !user) {
      toast.error("请先登录");
      return;
    }
    if (pending) return;
    setPending(true);
    try {
      await blogService.like(blogId);
      try {
        const data = await blogService.byId(blogId);
        onChanged?.({ liked: data.liked, isLike: !!data.isLike });
      } catch {
        // 查询失败时本地 +1 兜底（沿用 hmdp 前端的降级处理）
        onChanged?.({ liked: liked + 1, isLike: !isLike });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "点赞失败");
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      className={`${styles.like} ${isLike ? styles.liked : ""} ${styles[size]}`}
      onClick={handleClick}
      disabled={pending}
      title={isLike ? "取消点赞" : "点赞"}
    >
      <LikeIcon size={size === "large" ? 22 : 14} />
      <span>{liked}</span>
    </button>
  );
};

export default LikeButton;
