import { NavLink } from "react-router-dom";
import { AddIcon, BirdIcon, ChatIcon, HomeIcon, LocationIcon, UserIcon } from "@/components/icons/Icon";
import styles from "./Sidebar.module.css";

const navItems = [
  { to: "/", label: "首页", Icon: HomeIcon },
  { to: "/shops", label: "雀探", Icon: LocationIcon },
  { to: "/blog/new", label: "发笔记", Icon: AddIcon },
  { to: "/messages", label: "消息", Icon: ChatIcon },
  { to: "/profile", label: "我的", Icon: UserIcon }
] as const;

const Sidebar = () => (
  <aside className={styles.sidebar}>
    <NavLink to="/" className={styles.logo} aria-label="雀跃首页">
      <BirdIcon size={30} stroke="none" fill="#fff" />
    </NavLink>
    <nav className={styles.nav}>
      {navItems.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) => (isActive ? `${styles.link} ${styles.linkActive}` : styles.link)}
        >
          <Icon />
          {label}
        </NavLink>
      ))}
    </nav>
    <div className={styles.divider} />
    <div className={styles.footer}>
      <span>雀跃</span>
      <div>沉寂已久的心情，掀起了雀跃</div>
    </div>
  </aside>
);

export default Sidebar;
