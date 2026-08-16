import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { BackIcon } from "@/components/icons/Icon";
import styles from "./PageHeader.module.css";

type PageHeaderProps = {
  title?: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  children?: ReactNode;
};

/** 页面顶部栏：可选返回按钮 + 标题 + 右侧插槽 */
const PageHeader = ({ title, subtitle, back = false, right, children }: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      <div className={styles.row}>
        {back ? (
          <button type="button" className={styles.back} onClick={() => navigate(-1)} aria-label="返回">
            <BackIcon size={18} />
          </button>
        ) : null}
        <div className={styles.titles}>
          {title ? <h1 className={styles.title}>{title}</h1> : null}
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        {right ? <div className={styles.right}>{right}</div> : null}
      </div>
      {children}
    </header>
  );
};

export default PageHeader;
