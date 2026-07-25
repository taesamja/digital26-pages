const SYSTEM_PROMPT = `당신은 디지털 논리를 가르치는 친절한 AI 튜터입니다.
진법 변환, 논리 게이트, 불 대수, 2의 보수, ASCII를 한국어로 설명합니다.
학생이 이해할 수 있도록 계산 과정을 단계별로 보여주고 핵심 위주로 답합니다.
답변은 특별한 요청이 없으면 600자 이내로 작성합니다.`;

function getAllowedOrigins() {
  const configured = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
  if (process.env.VERCEL_URL) configured.push(`https://${process.env.VERCEL_URL}`);
  return [...new Set(configured)];
}

function setCors(response, origin) {
  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Vary", "Origin");
}

export default async function handler(request, response) {
  const origin = request.headers.origin || "";
  if (!getAllowedOrigins().includes(origin)) {
    return response.status(403).json({ error: "허용되지 않은 요청입니다." });
  }
  setCors(response, origin);
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body || {};
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message || message.length > 1000) {
      return response.status(400).json({ error: "1자 이상 1000자 이하의 질문을 입력하세요." });
    }

    const history = Array.isArray(body.history)
      ? body.history.slice(-6).filter((item) =>
          ["user", "assistant"].includes(item?.role) &&
          typeof item?.content === "string" &&
          item.content.length <= 2000
        )
      : [];

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        system: SYSTEM_PROMPT,
        max_tokens: 600,
        messages: [...history, { role: "user", content: message }]
      })
    });

    if (!anthropicResponse.ok) {
      const errorBody = await anthropicResponse.json().catch(() => ({}));
      const apiMessage = errorBody.error?.message || "";
      console.error("Anthropic request failed:", anthropicResponse.status, errorBody.error?.type, apiMessage);

      if (anthropicResponse.status === 401) return response.status(502).json({ error: "Claude API 키가 유효하지 않거나 만료되었습니다." });
      if (anthropicResponse.status === 402 || apiMessage.toLowerCase().includes("credit balance")) return response.status(402).json({ error: "Claude API 크레딧 또는 결제 정보를 확인해주세요." });
      if (anthropicResponse.status === 403) return response.status(502).json({ error: "Claude API 사용 권한이 없습니다." });
      if (anthropicResponse.status === 404) return response.status(502).json({ error: "설정한 Claude 모델을 사용할 수 없습니다." });
      if (anthropicResponse.status === 429) return response.status(429).json({ error: "Claude API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요." });
      return response.status(502).json({ error: `Claude API 요청에 실패했습니다. (상태 ${anthropicResponse.status})` });
    }

    const data = await anthropicResponse.json();
    const reply = data.content
      ?.filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n")
      .trim();
    if (!reply) return response.status(502).json({ error: "AI가 빈 응답을 반환했습니다." });
    return response.status(200).json({ reply });
  } catch (error) {
    console.error("Vercel function error:", error.message);
    return response.status(500).json({ error: "요청 처리 중 오류가 발생했습니다." });
  }
}
