import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ShopListPage from "./pages/ShopListPage";
import ShopDetailPage from "./pages/ShopDetailPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import BlogEditPage from "./pages/BlogEditPage";
import MessagesPage from "./pages/MessagesPage";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import UserPage from "./pages/UserPage";

/** 路由切换时立即回到页面顶部，避免保留旧滚动位置导致页面跳动 */
const ScrollToTop = () => {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);
  return null;
};

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/shops" element={<ShopListPage />} />
        <Route path="/shop/:id" element={<ShopDetailPage />} />
        <Route path="/blog/:id" element={<BlogDetailPage />} />
        <Route path="/blog/new" element={<BlogEditPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/user/:id" element={<UserPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
