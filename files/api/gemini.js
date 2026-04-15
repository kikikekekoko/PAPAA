export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    // 프론트엔드에서 보낸 데이터를 그대로 가져오되, 모델명을 안전한 것으로 강제 지정
    const { contents, system_instruction, tools, generationConfig } = req.body;
    
    // ⚠️ 모델명을 1.5-flash로 고정해서 먼저 성공시켜 봅시다.
    const model = "gemini-1.5-flash"; 

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents, system_instruction, tools, generationConfig }),
      }
    );

    const data = await response.json();

    // 구글이 뱉는 에러 메시지를 프론트엔드에 '그대로' 전달합니다.
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: "서버 코드 에러: " + e.message });
  }
}
