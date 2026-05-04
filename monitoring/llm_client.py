"""Shared LLM client for IRIS monitoring scripts.

Free-tier-first: tries providers in order (Gemini → Groq → Anthropic), falling
back on exhaustion / transient errors. Uses OpenAI-compatible HTTP for the
first two and the native Messages API for Anthropic. Pure stdlib, no SDK.

Env:
    GEMINI_API_KEY     Google AI Studio key (primary, free tier)
    GROQ_API_KEY       Groq key (fallback, free tier, separate quota)
    ANTHROPIC_API_KEY  Anthropic key (last resort, paid; may be unset)
    LLM_PROVIDER       Force a single provider: "gemini" | "groq" | "anthropic"

Each consumer is expected to instruct the model to return JSON in its prompt
and parse the response itself. `_strip_fences` removes markdown wrappers.
"""
import json
import os
import time
import urllib.error
import urllib.request


PROVIDERS = [
    {
        "name": "gemini",
        "env": "GEMINI_API_KEY",
        "url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        "model": "gemini-2.5-flash",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "kind": "openai",
    },
    {
        "name": "groq",
        "env": "GROQ_API_KEY",
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "model": "llama-3.3-70b-versatile",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "kind": "openai",
    },
    {
        "name": "anthropic",
        "env": "ANTHROPIC_API_KEY",
        "url": "https://api.anthropic.com/v1/messages",
        "model": "claude-haiku-4-5-20251001",
        "auth_header": "x-api-key",
        "auth_prefix": "",
        "kind": "anthropic",
    },
]


class LLMError(Exception):
    pass


def _active_providers():
    forced = os.environ.get("LLM_PROVIDER", "").strip().lower()
    chain = [p for p in PROVIDERS if os.environ.get(p["env"])]
    if forced:
        chain = [p for p in chain if p["name"] == forced]
    return chain


def _post(url, headers, payload, timeout=120):
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _call_openai(provider, system, user, max_tokens):
    headers = {
        "Content-Type": "application/json",
        provider["auth_header"]: provider["auth_prefix"] + os.environ[provider["env"]],
    }
    payload = {
        "model": provider["model"],
        "max_tokens": max_tokens,
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    body = _post(provider["url"], headers, payload)
    return body["choices"][0]["message"]["content"]


def _call_anthropic(provider, system, user, max_tokens):
    headers = {
        "Content-Type": "application/json",
        provider["auth_header"]: os.environ[provider["env"]],
        "anthropic-version": "2023-06-01",
    }
    payload = {
        "model": provider["model"],
        "max_tokens": max_tokens,
        "system": system,
        "messages": [{"role": "user", "content": user}],
    }
    body = _post(provider["url"], headers, payload)
    return "".join(b["text"] for b in body.get("content", []) if b.get("type") == "text")


def _strip_fences(text):
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
    return text.strip()


def call_llm(system, user, max_tokens=4096, max_retries=3):
    """Call the first available provider; fall back on quota / 5xx errors.

    Returns the raw text content (markdown fences stripped). Raises LLMError
    if all providers fail.
    """
    chain = _active_providers()
    if not chain:
        raise LLMError(
            "No provider key set (need GEMINI_API_KEY, GROQ_API_KEY, or ANTHROPIC_API_KEY)"
        )

    last_err = None
    for provider in chain:
        for attempt in range(1, max_retries + 1):
            try:
                if provider["kind"] == "anthropic":
                    text = _call_anthropic(provider, system, user, max_tokens)
                else:
                    text = _call_openai(provider, system, user, max_tokens)
                return _strip_fences(text)
            except urllib.error.HTTPError as e:
                code = e.code
                try:
                    body = e.read().decode("utf-8")[:300]
                except Exception:
                    body = ""
                last_err = f"{provider['name']} HTTP {code}: {body}"
                # Quota exhausted — try next provider
                if code == 429:
                    print(f"  [{provider['name']}] 429 quota exhausted — falling back")
                    break
                # Auth/credit issues — try next provider
                if code in (401, 402, 403):
                    print(f"  [{provider['name']}] {code} auth/credit — falling back")
                    break
                # 5xx transient — retry same provider
                if code >= 500 and attempt < max_retries:
                    time.sleep(2 ** attempt)
                    continue
                # Other 4xx — fall back, response shape may not match
                print(f"  [{provider['name']}] {code} — falling back: {body[:120]}")
                break
            except (urllib.error.URLError, TimeoutError) as e:
                last_err = f"{provider['name']} network: {e}"
                if attempt < max_retries:
                    time.sleep(2 ** attempt)
                    continue
                print(f"  [{provider['name']}] network error — falling back")
                break
            except Exception as e:
                last_err = f"{provider['name']} error: {e}"
                print(f"  [{provider['name']}] {e} — falling back")
                break
    raise LLMError(f"All providers failed. Last error: {last_err}")


def active_provider_name():
    """Return name of first available provider (for logging). Empty string if none."""
    chain = _active_providers()
    return chain[0]["name"] if chain else ""
