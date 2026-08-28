import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { countCodePoints, validateQuestion } from "../utils/validation";

// 🏷️ ChatComposer Props 인터페이스 정의
interface ChatComposerProps {
  sending: boolean;
  sendError: string | null;
  onSend: (text: string) => Promise<boolean>;
  onErrorChange: (error: string | null) => void;
}

// ⌨️ 대화 입력 폼 컴포넌트 (높이 자동 확장 & 한글 IME 중복 방어)
export function ChatComposer({
  sending,
  sendError,
  onSend,
  onErrorChange,
}: ChatComposerProps) {
  const [question, setQuestion] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // 📏 글자 수 및 잔여 글자 수 계산
  const questionLength = countCodePoints(question);
  const remaining = 500 - questionLength;

  // 🚀 폼 전송 핸들러
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateQuestion(question);
    if (validation) {
      setInputError(validation);
      return;
    }

    const success = await onSend(question);
    if (success) {
      setQuestion("");
      setInputError(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  // ⌨️ 키보드 입력 핸들러 (한글 조합 방어 및 Shift+Enter 지원)
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // 🛡️ 한글 자모 조합 중 발생한 Enter는 무시하여 2회 전송 차단
    if (event.nativeEvent.isComposing) return;

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  // 📐 텍스트 변경 및 textarea 높이 동적 계산
  const handleChange = (text: string) => {
    setQuestion(text);
    setInputError(null);
    onErrorChange(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const displayedError = inputError || sendError;

  return (
    <div className="sticky bottom-0 z-10 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pb-4 pt-4 sm:pb-6">
      <div className="mx-auto max-w-3xl">
        <form
          ref={formRef}
          onSubmit={(e) => void handleSubmit(e)}
          className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-300/25 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100/80"
        >
          <label htmlFor="chat-question" className="sr-only">
            AI에게 보낼 질문
          </label>

          {/* 📝 자동 확장 텍스트영역 */}
          <textarea
            ref={textareaRef}
            id="chat-question"
            name="question"
            rows={2}
            value={question}
            disabled={sending}
            placeholder="AI에게 무엇이든 물어보세요…"
            onKeyDown={handleKeyDown}
            onChange={(e) => handleChange(e.target.value)}
            className="max-h-40 min-h-14 w-full resize-none bg-transparent px-3 py-2 text-[15px] leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-70 overflow-y-auto"
          />

          {/* 🧰 하단 툴바: 안내 문구, 글자 수, 전송 버튼 */}
          <div className="flex items-center justify-between gap-3 px-2 pb-1">
            <div className="min-w-0">
              <p id="question-help" className="text-xs text-slate-400">
                Enter 전송 · Shift+Enter 줄바꿈
              </p>
              {displayedError ? (
                <p
                  id="question-error"
                  className="mt-1 text-xs font-medium text-rose-600"
                >
                  {displayedError}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span
                className={`text-xs font-medium ${remaining < 0 ? "text-rose-600" : "text-slate-400"}`}
                aria-live="polite"
              >
                {remaining >= 0
                  ? `${remaining}자 남음`
                  : `${Math.abs(remaining)}자 초과`}
              </span>

              <button
                type="submit"
                disabled={sending || remaining < 0}
                className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={sending ? "질문 전송 중" : "질문 전송"}
              >
                {sending ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="size-5"
                    aria-hidden="true"
                  >
                    <path
                      d="m5 12 14-7-4.5 14-2.8-5.2L5 12Zm6.7 1.8L19 5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
