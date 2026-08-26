import { useEffect, useState } from "react";

export function useSmartScroll<T>(dependency: T) {
  const [showBottomButton, setShowBottomButton] = useState(false);

  const handleScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowBottomButton(!isAtBottom);
  };

  const scrollToBottom = (smooth = true) => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!showBottomButton) {
      scrollToBottom();
    }
  }, [dependency]);

  return { showBottomButton, scrollToBottom };
}
