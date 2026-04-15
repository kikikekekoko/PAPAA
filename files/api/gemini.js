export default async function handler(req, res) {
  // POST 요청이 아니면 차단 (보안)
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(401).json({ error: "Vercel 환경변수에 API 키가 없습니다." });

    // 2026년 최신 표준 모델명: gemini-3-flash
    const model = "gemini-3-flash"; 

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Google API Error",
        details: data.error?.message || "Unknown error"
      });
    }

    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: "Server Crash: " + e.message });
  }
}
