import os
import json
import decimal
import httpx

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"


def generate_profiles_insight(profiles_data: list, total_leads: int, total_actions: int) -> str:
    """
    Generates an AI insight based on profiles performance data via Claude (Anthropic).
    """
    if not profiles_data:
        return "Not enough data available for the selected period to generate meaningful insights."

    if not ANTHROPIC_API_KEY:
        return "AI insights are not configured. Set ANTHROPIC_API_KEY on the backend."

    class DecimalEncoder(json.JSONEncoder):
        def default(self, o):
            if isinstance(o, decimal.Decimal):
                return float(o)
            return super().default(o)

    data_summary = json.dumps({
        "overall_metrics": {
            "total_new_leads": total_leads,
            "total_actions_performed": total_actions
        },
        "profiles_performance": profiles_data
    }, indent=2, cls=DecimalEncoder)

    prompt = f"""You are an expert B2B Sales & Lead Generation Analyst.
I am providing you with the performance data of our LinkedIn outreach profiles for the selected period.

Data:
{data_summary}

Please provide a concise, actionable insight (2-3 sentences max) highlighting:
1. Any standout performers or underperformers.
2. Conversion bottlenecks (e.g., high acceptance but low reply rate) or strengths.
3. One concrete recommendation for improvement.

Keep it professional, direct, and use markdown formatting (e.g. bolding) for key metrics and names. Do not include any introductory or concluding fluff like "Here is the insight". Just return the analytical text."""

    try:
        response = httpx.post(
            ANTHROPIC_API_URL,
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": ANTHROPIC_MODEL,
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=60.0,
        )
        response.raise_for_status()
        payload = response.json()
        blocks = payload.get("content") or []
        text_parts = [block.get("text", "") for block in blocks if block.get("type") == "text"]
        return "\n".join(part for part in text_parts if part).strip() or "Unable to generate insights at this moment. Please try again later."
    except Exception as e:
        print(f"Error generating AI insight: {e}")
        return "Unable to generate insights at this moment. Please try again later."
