// App.jsx의 callGemini 함수 부분만 아래처럼 수정하거나 확인하세요.
async function callGemini({ systemPrompt, imageParts = [], textPrompt, useSearch = true }) {
  const body = {
    model: "gemini-1.5-flash", // 3.0에서 1.5로 수정 (가장 확실한 통신을 위해)
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
  // 401 에러 등이 나면 여기서 바로 에러 메시지를 띄워줍니다.
  if (!res.ok) throw new Error(data.error?.message || data.error || "인증 오류(키 확인 필요)");

  const text = data.candidates?.[0]?.content?.parts
    ?.filter(p => p.text).map(p => p.text).join("") || "";
  if (!text) throw new Error("응답이 비어있습니다");
  return text;
}
