import os
from google import genai
import json

# Setup API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "REDACTED_GEMINI_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

def generate_profiles_insight(profiles_data: list, total_leads: int, total_actions: int) -> str:
    """
    Generates an AI insight based on profiles performance data.
    """
    if not profiles_data:
        return "Not enough data available for the selected period to generate meaningful insights."

    # Prepare data for prompt
    import decimal
    
    class DecimalEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, decimal.Decimal):
                return float(obj)
            return super(DecimalEncoder, self).default(obj)
            
    data_summary = json.dumps({
        "overall_metrics": {
            "total_new_leads": total_leads,
            "total_actions_performed": total_actions
        },
        "profiles_performance": profiles_data
    }, indent=2, cls=DecimalEncoder)

    prompt = f"""
You are an expert B2B Sales & Lead Generation Analyst.
I am providing you with the performance data of our LinkedIn outreach profiles for the selected period.

Data:
{data_summary}

Please provide a concise, actionable insight (2-3 sentences max) highlighting:
1. Any standout performers or underperformers.
2. Conversion bottlenecks (e.g., high acceptance but low reply rate) or strengths.
3. One concrete recommendation for improvement.

Keep it professional, direct, and use markdown formatting (e.g. bolding) for key metrics and names. Do not include any introductory or concluding fluff like "Here is the insight". Just return the analytical text.
"""

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"Error generating AI insight: {e}")
        return "Unable to generate insights at this moment. Please try again later."
