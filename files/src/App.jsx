import { useState, useRef, useCallback } from "react";

// ─── Gemini 3 API 호출 함수 ──────────────────────────────────────────────────
async function callGemini({ systemPrompt, imageParts = [], textPrompt, useSearch = true }) {
  const body = {
    model: "gemini-3-flash", // 최신 3.0 엔진 사용
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
  if (!res.ok) throw new Error(data.error?.details || data.error || "인증 오류");

  const text = data.candidates?.[0]?.content?.parts
    ?.filter(p => p.text).map(p => p.text).join("") || "";
  
  if (!text) throw new Error("응답이 비어있습니다. 다시 시도해주세요.");
  return text;
}

// ─── JSON 추출 로직 ──────────────────────────────────────────────────────────
function extractJSON(text) {
  const clean = text.replace(/```json|```/gi, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("데이터 해석 실패");
  return JSON.parse(clean.slice(start, end + 1));
}

// ─── 프롬프트 ───────────────────────────────────────────────────────────────
const GENERATE_PROMPT = `상세페이지 카피라이터로서 제품 정보를 조사하고 JSON으로만 응답하세요. { "productName": "", "brand": "", "category": "", "oneLiner": "", "usages": "", "features": [{"title":"", "desc":""}], "recommendations": [], "storage": {"type":"", "temperature":"", "afterOpen":"", "shelfLife":""} }`;

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────────
export default function ProductDescriber() {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMime, setImageMime] = useState("image/jpeg");
  const [manualName, setManualName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const processFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      setImageBase64(e.target.result.split(",")[1]);
      setImageMime(file.type);
    };
    reader.readAsDataURL(file);
  }, []);

  const analyze = async () => {
    if (!imageBase64 && !manualName.trim()) return;
    setLoading(true); setError(null); setResult(null);

    try {
      const raw = await callGemini({
        systemPrompt: GENERATE_PROMPT,
        imageParts: imageBase64 ? [{ inline_data: { mime_type: imageMime, data: imageBase64 } }] : [],
        textPrompt: `제품명: ${manualName}\n위 사진과 정보를 분석해서 쇼핑몰용 상세 설명을 JSON으로 생성해줘.`,
      });
      setResult(extractJSON(raw));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <header style={{ textAlign: "center", marginBottom: 30 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>🚀 상세페이지 생성기 (Gemini 3)</h1>
      </header>

      <div onClick={() => fileRef.current?.click()} 
           style={{ border: "2px dashed #ddd", borderRadius: 15, padding: 40, textAlign: "center", cursor: "pointer", background: "#fff", marginBottom: 20 }}>
        {image ? <img src={image} style={{ width: "100%", borderRadius: 10 }} /> : "📷 제품 사진을 업로드하세요"}
      </div>
      <input ref={fileRef} type="file" onChange={e => processFile(e.target.files[0])} style={{ display: "none" }} />

      <input type="text" placeholder="제품명을 입력하면 더 정확해집니다" value={manualName} 
             onChange={e => setManualName(e.target.value)}
             style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd", marginBottom: 15, boxSizing: "border-box" }} />

      <button onClick={analyze} disabled={loading}
              style={{ width: "100%", padding: 15, borderRadius: 10, background: loading ? "#ccc" : "#000", color: "#fff", border: "none", fontWeight: "bold", cursor: "pointer" }}>
        {loading ? "AI가 분석 중..." : "설명 생성하기"}
      </button>

      {error && <div style={{ color: "red", marginTop: 20, padding: 10, background: "#fff1f1", borderRadius: 8 }}>⚠️ {error}</div>}

      {result && (
        <div style={{ marginTop: 30, padding: 25, background: "#fff", borderRadius: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
          <span style={{ fontSize: 12, color: "#888" }}>{result.brand}</span>
          <h2 style={{ margin: "5px 0", fontSize: 22 }}>{result.productName}</h2>
          <p style={{ color: "#4285f4", fontWeight: "bold" }}>{result.oneLiner}</p>
          <hr style={{ border: "0", borderTop: "1px solid #eee", margin: "20px 0" }} />
          <div style={{ lineHeight: 1.8, color: "#444" }}>{result.usages}</div>
        </div>
      )}
    </div>
  );
}
