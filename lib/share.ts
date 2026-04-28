declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: {
          objectType: string;
          content: {
            title: string;
            description: string;
            imageUrl?: string;
            link: { mobileWebUrl: string; webUrl: string };
          };
          buttons?: Array<{
            title: string;
            link: { mobileWebUrl: string; webUrl: string };
          }>;
        }) => void;
      };
    };
  }
}

/**
 * 카카오 SDK 초기화
 * NEXT_PUBLIC_KAKAO_JS_KEY 환경변수 사용
 */
export function initKakaoSDK(): void {
  if (typeof window === "undefined") return;
  if (!window.Kakao) return;
  if (window.Kakao.isInitialized()) return;

  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!key) {
    console.warn("[share] NEXT_PUBLIC_KAKAO_JS_KEY가 설정되지 않았습니다.");
    return;
  }

  window.Kakao.init(key);
}

/**
 * 공유용 URL 생성 (세션 ID 기반)
 */
export function getShareUrl(sessionId: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "https://saju.kkeullim.kr";
  return `${base}/chat?session=${sessionId}`;
}

/**
 * 카카오톡 공유
 */
export function shareToKakao(
  title: string,
  description: string,
  url: string
): void {
  if (typeof window === "undefined") return;

  initKakaoSDK();

  if (!window.Kakao?.Share) {
    alert("카카오톡 공유 기능을 불러오지 못했습니다.");
    return;
  }

  window.Kakao.Share.sendDefault({
    objectType: "feed",
    content: {
      title,
      description,
      link: { mobileWebUrl: url, webUrl: url },
    },
    buttons: [
      {
        title: "결과 보러가기",
        link: { mobileWebUrl: url, webUrl: url },
      },
    ],
  });
}

/**
 * 클립보드에 링크 복사
 */
export async function copyLink(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    // fallback
    const textarea = document.createElement("textarea");
    textarea.value = url;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  }
}
