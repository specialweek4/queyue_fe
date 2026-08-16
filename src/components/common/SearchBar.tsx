import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { SearchIcon } from "@/components/icons/Icon";
import styles from "./SearchBar.module.css";

type SearchBarProps = {
  initialValue?: string;
  placeholder?: string;
  onSearch?: (keyword: string) => void;
  className?: string;
};

/** 搜索栏：回车或点击图标后跳转 /shops?q=关键词（对应 hmdp 首页搜索） */
const SearchBar = ({ initialValue = "", placeholder = "搜索店铺名称", onSearch, className = "" }: SearchBarProps) => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState(initialValue);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const q = keyword.trim();
    if (!q) return;
    if (onSearch) {
      onSearch(q);
    } else {
      navigate(`/shops?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <form className={`${styles.bar} ${className}`} onSubmit={submit}>
      <input
        className={styles.input}
        value={keyword}
        onChange={event => setKeyword(event.target.value)}
        placeholder={placeholder}
        aria-label="搜索"
      />
      <button type="submit" className={styles.button} aria-label="搜索">
        <SearchIcon size={17} />
      </button>
    </form>
  );
};

export default SearchBar;
