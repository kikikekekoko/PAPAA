export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    // 프론트엔드에서 보낸 body 데이터를 그대로 가져옵니다.
    const body = req.body || {};
    // 프론트엔드에서 모델명을 안 보내면 1.5-flash를 기본으로 씁니다.
    const model = body.model || "gemini-1.5-flash";
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(401).json({ error: "Vercel 환경변수에 API 키가 없습니다." });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body), // 프론트엔드가 보낸 구조 그대로 전달
      }
    );

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (e) {
    res.status(500).json({ error: "서버 터짐: " + e.message });
  }
}
