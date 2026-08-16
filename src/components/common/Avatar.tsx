import { useEffect, useState } from "react";
import { UserIcon } from "@/components/icons/Icon";
import styles from "./Avatar.module.css";

type AvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
};

/** 用户头像：加载失败或未设置时回退到“昵称首字 + 主题色”占位 */
const Avatar = ({ src, name = "", size = 40, className = "" }: AvatarProps) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const style = { width: size, height: size, fontSize: size * 0.4 };

  if (!src || failed) {
    const text = name ? name.trim().slice(0, 1) : "";
    return (
      <div className={`${styles.placeholder} ${className}`} style={style} aria-label={name || "用户"}>
        {text || <UserIcon size={size * 0.5} />}
      </div>
    );
  }

  return (
    <img
      className={`${styles.avatar} ${className}`}
      style={style}
      src={src}
      alt={name || "头像"}
      onError={() => setFailed(true)}
    />
  );
};

export default Avatar;
