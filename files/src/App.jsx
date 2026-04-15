// App.jsx 상단의 callGemini 함수만 이 내용으로 바꾸세요.
async function callGemini({ systemPrompt, imageParts = [], textPrompt, useSearch = true }) {
  const body = {
    // 서버에서 1.5-flash로 고정했으므로 여기서도 맞춰줍니다.
    model: "gemini-1.5-flash", 
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{
      role: "user",
      parts: [...imageParts, { text: textPrompt }]
    }],
    ...(useSearch && { tools: [{ google_search: {} }] }),
    generationConfig: { temperature: 0.4, maxOutputTokens: 4096 }
  };

  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    // 구글이 보낸 실제 에러 이유를 화면에 띄웁니다.
    const detail = data.error?.message || JSON.stringify(data);
    throw new Error(`구글 서버 응답: ${detail}`);
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.filter(p => p.text).map(p => p.text).join("") || "";
  if (!text) throw new Error("응답이 비어있습니다");
  return text;
}
