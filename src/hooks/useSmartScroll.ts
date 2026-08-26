import { useCallback, useEffect, useRef, useState } from "react";

export function useSmartScroll<T>(dependency: T) {
  const [showBottomButton, setShowBottomButton] = useState(false);
  const isNearBottomRef = useRef(true);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;

    isNearBottomRef.current = isNearBottom;
    setShowBottomButton(!isNearBottom);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom(true);
    }
  }, [dependency, scrollToBottom]);

  return { showBottomButton, scrollToBottom };
}
