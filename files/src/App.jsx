import { useState, useRef, useCallback } from "react";

// ─── Gemini API 호출 ────────────────────────────────────────────────────────
async function callGemini({ systemPrompt, imageParts = [], textPrompt, useSearch = true }) {
  const body = {
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
  if (!res.ok) throw new Error(data.error?.message || data.error || "API 오류");

  const text = data.candidates?.[0]?.content?.parts
    ?.filter(p => p.text).map(p => p.text).join("") || "";
  if (!text) throw new Error("응답이 비어있습니다");
  return text;
}

// ─── JSON 추출 및 프롬프트 (중략 - 기존과 동일) ──────────────────────────────
function extractJSON(text) {
  const clean = text.replace(/```json|```/gi, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("JSON 형식이 아닙니다");
  return JSON.parse(clean.slice(start, end + 1));
}

const GENERATE_PROMPT = `상세페이지 전문 카피라이터로서 제품 정보를 JSON으로 응답하세요.`;
const FACTCHECK_PROMPT = `팩트체커로서 결과를 JSON 배열로 응답하세요.`;

const CAT_COLOR = { "식품":"#f97316","음료":"#3b82f6","냉동식품":"#06b6d4","냉장식품":"#10b981","과자/스낵":"#f59e0b","건강식품":"#84cc16","생활용품":"#8b5cf6","화장품":"#ec4899","기타":"#6b7280" };
const ST_COLOR = { "냉동":"#06b6d4","냉장":"#10b981","상온":"#f97316" };
const STATUS_CFG = {
  confirmed: { color:"#10b981", icon:"✅", label:"사실 확인" },
  uncertain:  { color:"#f59e0b", icon:"❓", label:"확인 불가" },
  corrected:  { color:"#ef4444", icon:"⚠️", label:"정정 필요" },
};

function SectionHeader({ icon, title, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:13, paddingBottom:9, borderBottom:`2px solid ${color}25` }}>
      <span style={{ width:27,height:27,borderRadius:8,background:`${color}20`,color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13 }}>{icon}</span>
      <span style={{ fontSize:13,fontWeight:800,color:"#1a1a2e" }}>{title}</span>
    </div>
  );
}

// ─── 메인 컴포넌트 (여기가 핵심입니다) ──────────────────────────────────────────
export default function ProductDescriber() {
  const [image, setImage]               = useState(null);
  const [imageBase64, setImageBase64]   = useState(null);
  const [imageMime, setImageMime]       = useState("image/jpeg");
  const [manualName, setManualName]     = useState("");
  const [manualFeatures, setManualFeatures] = useState("");
  const [result, setResult]               = useState(null);
  const [factChecks, setFactChecks]       = useState(null);
  const [loading, setLoading]           = useState(false);
  const [loadingStep, setLoadingStep]   = useState("");
  const [error, setError]               = useState(null);
  const [dragOver, setDragOver]         = useState(false);
  const [copied, setCopied]             = useState(false);
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
    setLoading(true); setError(null);
    try {
      setLoadingStep("🔍 분석 중...");
      const raw = await callGemini({
        systemPrompt: GENERATE_PROMPT,
        imageParts: imageBase64 ? [{ inline_data: { mime_type: imageMime, data: imageBase64 } }] : [],
        textPrompt: `제품명: ${manualName}\n특징: ${manualFeatures}\n조사 후 JSON 응답`,
      });
      setResult(extractJSON(raw));
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const catColor = result ? (CAT_COLOR[result.category]||"#6b7280") : "#6b7280";

  return (
    <div style={{ maxWidth:600, margin:"40px auto", padding:20, fontFamily:"sans-serif" }}>
      <h1 style={{ textAlign:"center" }}>📸 상세페이지 생성기</h1>
      
      <div onClick={()=>fileRef.current?.click()} 
           style={{ border:"2px dashed #ccc", padding:40, textAlign:"center", cursor:"pointer", marginBottom:20 }}>
        {image ? <img src={image} style={{ width:"100%" }} /> : "이미지를 업로드하세요"}
      </div>
      <input ref={fileRef} type="file" onChange={e=>processFile(e.target.files[0])} style={{ display:"none" }} />
      
      <input type="text" placeholder="제품명" value={manualName} onChange={e=>setManualName(e.target.value)} style={{ width:"100%", padding:10, marginBottom:10 }} />
      <button onClick={analyze} disabled={loading} style={{ width:"100%", padding:15, background:"#4285f4", color:"#fff", border:"none", fontWeight:"bold" }}>
        {loading ? "생성 중..." : "설명 생성하기"}
      </button>

      {error && <p style={{ color:"red" }}>{error}</p>}
      
      {result && (
        <div style={{ marginTop:30, padding:20, border:`2px solid ${catColor}`, borderRadius:10 }}>
          <h2>{result.productName}</h2>
          <p>{result.oneLiner}</p>
          <div style={{ whiteSpace:"pre-wrap" }}>{result.usages}</div>
        </div>
      )}
    </div>
  );
}
