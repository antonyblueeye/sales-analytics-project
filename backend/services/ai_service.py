import os
import json
import decimal
import httpx

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
DEFAULT_MODEL = "claude-haiku-4-5"
FALLBACK_MODELS = (
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-6",
)

# Retired aliases — ignore if set via env
DEPRECATED_MODELS = frozenset({
    "claude-3-5-haiku-latest",
    "claude-3-5-sonnet-latest",
    "claude-3-5-haiku-20241022",
    "claude-3-5-sonnet-20241022",
})


def _get_api_key() -> str:
    key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("CLAUDE_API_KEY") or ""
    return key.strip().strip('"').strip("'")


def _get_model() -> str:
    env_model = (os.getenv("ANTHROPIC_MODEL") or "").strip()
    if env_model and env_model not in DEPRECATED_MODELS:
        return env_model
    return DEFAULT_MODEL


def _models_to_try() -> list[str]:
    primary = _get_model()
    chain = [primary]
    for model in FALLBACK_MODELS:
        if model not in chain:
            chain.append(model)
    return chain


def _call_anthropic(api_key: str, model: str, prompt: str) -> httpx.Response:
    return httpx.post(
        ANTHROPIC_API_URL,
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": model,
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=60.0,
    )


def _parse_api_error(response: httpx.Response) -> str:
    try:
        data = response.json()
        err = data.get("error") or {}
        if isinstance(err, dict):
            return err.get("message") or str(err)
        return str(err)
    except Exception:
        return response.text[:300]


def generate_profiles_insight(profiles_data: list, total_leads: int, total_actions: int) -> str:
    """
    Generates an AI insight based on profiles performance data via Claude (Anthropic).
    """
    if not profiles_data:
        return "Not enough data available for the selected period to generate meaningful insights."

    api_key = _get_api_key()
    if not api_key:
        return "AI insights are not configured. Add ANTHROPIC_API_KEY in Railway backend variables and redeploy."

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
        response = None
        last_detail = ""
        for model in _models_to_try():
            response = _call_anthropic(api_key, model, prompt)
            if response.status_code == 404:
                last_detail = _parse_api_error(response)
                print(f"Anthropic model not found ({model}): {last_detail}")
                continue
            break

        if response is None:
            return "Unable to generate insights at this moment. Please try again later."

        if response.status_code >= 400:
            detail = _parse_api_error(response)
            print(f"Anthropic API error ({response.status_code}, model={model}): {detail}")
            if response.status_code == 401:
                return "AI authentication failed. Check ANTHROPIC_API_KEY in Railway (no quotes, redeploy after saving)."
            if response.status_code == 404:
                return f"AI model not found. Remove ANTHROPIC_MODEL from Railway or set ANTHROPIC_MODEL=claude-haiku-4-5"
            return f"AI service error: {detail}"

        payload = response.json()
        blocks = payload.get("content") or []
        text_parts = [block.get("text", "") for block in blocks if block.get("type") == "text"]
        text = "\n".join(part for part in text_parts if part).strip()
        if text:
            return text
        print(f"Anthropic API returned empty content: {payload}")
        return "AI returned an empty response. Please try again."
    except httpx.TimeoutException:
        print("Anthropic API timeout")
        return "AI request timed out. Please try again."
    except Exception as e:
        print(f"Error generating AI insight: {e}")
        return "Unable to generate insights at this moment. Please try again later."
