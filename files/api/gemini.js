export default async function handler(req, res) {
  // 1. 보안을 위해 POST 요청만 허용 (브라우저 주소창 접속 차단)
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    // 2. 모델명을 2026년 최신 표준인 gemini-3-flash로 고정
    const { model = "gemini-3-flash", ...body } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(401).json({ error: "환경변수에 API 키가 없습니다." });
    }

    // 3. 구글 API 호출
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    // 4. 구글 서버에서 보낸 에러가 있다면 그대로 전달 (디버깅용)
    if (!response.ok) {
      return res.status(response.status).json({
        error: "Google API Error",
        details: data
      });
    }

    res.status(200).json(data);

  } catch (e) {
    // 5. 서버 내부 붕괴 시 에러 메시지 출력
    res.status(500).json({ error: "Server Crash: " + e.message });
  }
}
