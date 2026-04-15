export default async function handler(req, res) {
  // ⚠️ 테스트용입니다. 성공 확인 후 반드시 원래대로 돌려야 합니다!
  // process.env 대신 실제 AIza...로 시작하는 키를 따옴표 안에 넣으세요.
  const apiKey = "여기에_실제_API_키를_직접_붙여넣으세요"; 

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      }
    );
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
