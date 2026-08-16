import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

const EmptyState = ({ icon, title, description, action, className = "" }: EmptyStateProps) => (
  <div className={`${styles.empty} ${className}`}>
    {icon ? <div className={styles.icon}>{icon}</div> : null}
    <div className={styles.title}>{title}</div>
    {description ? <div className={styles.description}>{description}</div> : null}
    {action ? <div className={styles.action}>{action}</div> : null}
  </div>
);

export default EmptyState;
