from google import genai
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=API_KEY)

def get_health_comment(test_results):
    prompt = f"""
    Sen güvenli bir sağlık asistanısın.
    Aşağıdaki laboratuvar sonuçlarını yorumla ve öneriler ver:
    {test_results}
    """
    
    response = client.models.generate_content(
        model="gemini-2.0-flash",   # ✔ Doğru model
        contents=prompt                  # ✔ Dashboard ile aynı parametre
    )

    return response.text                # ✔ Yeni SDK’da output_text yerine text
