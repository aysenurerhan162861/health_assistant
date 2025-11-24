// frontend/services/GeminiApi.ts
export interface TestResult {
  name: string;
  value: number;
  status: "low" | "normal" | "high";
}

export const fetchGeminiComment = async (testResults: TestResult[]): Promise<string> => {
  const response = await fetch("http://localhost:8000/api/gemini_api/comment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ testResults }),
  });
  const data = await response.json();
  return data.comment;
};
