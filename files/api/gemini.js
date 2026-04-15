export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const { model = "gemini-1.5-flash", ...body } = req.body || {};
    
    // 현재 서버가 인식하고 있는 환경변수 목록을 확인 (보안상 값은 안 보여줌)
    const envKeys = Object.keys(process.env);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(401).json({ 
        error: "열쇠(API 키)를 찾을 수 없습니다.",
        debug: `현재 인식된 변수들: ${envKeys.join(", ")}` 
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (e) {
    res.status(500).json({ error: "서버 터짐: " + e.message });
  }
}
