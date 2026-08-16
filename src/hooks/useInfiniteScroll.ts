import { useEffect, useRef } from "react";
import type { RefObject } from "react";

/**
 * 触底加载更多。
 * 传入 null 时监听 window 滚动（页面整体滚动），否则监听指定容器。
 * 沿用 hmdp 前端的“scrollTop + offsetHeight > scrollHeight”触底判定。
 */
export function useInfiniteScroll(
  targetRef: RefObject<HTMLElement | null> | null,
  onLoadMore: () => void,
  options: { distance?: number; disabled?: boolean } = {}
) {
  const { distance = 40, disabled = false } = options;
  const handlerRef = useRef(onLoadMore);
  handlerRef.current = onLoadMore;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  useEffect(() => {
    const el = targetRef === null ? null : targetRef.current;

    const check = () => {
      if (disabledRef.current) return;
      if (el) {
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - distance) {
          handlerRef.current();
        }
        return;
      }
      const doc = document.documentElement;
      if (window.scrollY + window.innerHeight >= doc.scrollHeight - distance) {
        handlerRef.current();
      }
    };

    const scroller = el ?? window;
    scroller.addEventListener("scroll", check, { passive: true });
    // 内容不足一屏时补一次检查
    check();
    return () => scroller.removeEventListener("scroll", check);
  }, [targetRef, distance]);
}
