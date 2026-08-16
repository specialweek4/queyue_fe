import { useEffect, useState } from "react";
import { ImageIcon } from "@/components/icons/Icon";
import { resolveImgUrl } from "@/utils/image";
import styles from "./Thumb.module.css";

type ThumbProps = {
  src?: string | null;
  alt?: string;
  className?: string;
  /** 占位图形样式 */
  kind?: "blog" | "shop" | "user";
};

/** 图片缩略图：加载失败时显示主题色占位块 */
const Thumb = ({ src, alt = "", className = "", kind = "blog" }: ThumbProps) => {
  const [failed, setFailed] = useState(false);
  const resolved = resolveImgUrl(src);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className={`${styles.fallback} ${styles[kind]} ${className}`} role="img" aria-label={alt || "图片"}>
        <ImageIcon size={26} />
      </div>
    );
  }

  return <img className={`${styles.thumb} ${className}`} src={resolved} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
};

export default Thumb;
