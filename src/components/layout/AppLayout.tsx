import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import styles from "./AppLayout.module.css";

type AppLayoutProps = {
  header?: ReactNode;
  children: ReactNode;
  /** cardless：内容直接铺开（适合列表滚动页），默认包一层白色卡片 */
  variant?: "default" | "cardless";
};

const AppLayout = ({ header, children, variant = "default" }: AppLayoutProps) => (
  <div className="app-shell">
    <Sidebar />
    <div className={styles.container}>
      {header}
      <div className={variant === "default" ? styles.pageCard : styles.main}>{children}</div>
    </div>
  </div>
);

export default AppLayout;
