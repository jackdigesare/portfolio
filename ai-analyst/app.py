"""AI Analyst — Streamlit app for data profiling and Claude-powered insights."""

from __future__ import annotations

import json
import os
from typing import Any

import pandas as pd
import streamlit as st
from anthropic import Anthropic

MODEL = "claude-sonnet-4-20250514"


def get_api_key() -> str:
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if api_key:
        return api_key
    try:
        return str(st.secrets["ANTHROPIC_API_KEY"])
    except Exception:
        return ""


def get_client() -> Anthropic:
    api_key = get_api_key()
    if not api_key:
        st.error(
            "Missing `ANTHROPIC_API_KEY`. Set it as an environment variable "
            "or add it to `.streamlit/secrets.toml`."
        )
        st.stop()
    return Anthropic(api_key=api_key)


def load_dataframe(uploaded_file) -> pd.DataFrame:
    name = uploaded_file.name.lower()
    if name.endswith(".csv"):
        return pd.read_csv(uploaded_file)
    if name.endswith(".xlsx"):
        return pd.read_excel(uploaded_file, engine="openpyxl")
    raise ValueError("Unsupported file type. Please upload a .csv or .xlsx file.")


def profile_dataframe(df: pd.DataFrame) -> list[dict[str, Any]]:
    """Compute per-column profiling stats. Never includes raw row values."""
    n_rows = len(df)
    profiles: list[dict[str, Any]] = []

    for col in df.columns:
        series = df[col]
        null_pct = float(series.isna().mean() * 100) if n_rows else 0.0
        entry: dict[str, Any] = {
            "column": str(col),
            "dtype": str(series.dtype),
            "null_pct": round(null_pct, 2),
            "unique_count": int(series.nunique(dropna=True)),
        }

        if pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series):
            numeric = pd.to_numeric(series, errors="coerce").dropna()
            if len(numeric) > 0:
                mean = float(numeric.mean())
                std = float(numeric.std(ddof=0))
                entry["min"] = float(numeric.min())
                entry["max"] = float(numeric.max())
                entry["mean"] = round(mean, 4)
                if std > 0:
                    outlier_mask = (numeric - mean).abs() > (3 * std)
                    entry["outlier_count"] = int(outlier_mask.sum())
                    entry["outlier_pct"] = round(float(outlier_mask.mean() * 100), 2)
                else:
                    entry["outlier_count"] = 0
                    entry["outlier_pct"] = 0.0
            else:
                entry["min"] = None
                entry["max"] = None
                entry["mean"] = None
                entry["outlier_count"] = 0
                entry["outlier_pct"] = 0.0

        profiles.append(entry)

    return profiles


def profiling_summary_text(df: pd.DataFrame, profiles: list[dict[str, Any]]) -> str:
    """Compact text summary of shape + profiling — safe to send to Claude."""
    payload = {
        "shape": {"rows": int(len(df)), "columns": int(len(df.columns))},
        "column_names": [str(c) for c in df.columns],
        "column_profiles": profiles,
    }
    return json.dumps(payload, indent=2)


ANALYSIS_PROMPT = """You are a data analyst assistant. You are given a profiling summary of a dataset
(column names, dtypes, null rates, unique counts, and for numeric columns min/max/mean and outlier counts).
You do NOT have access to the raw rows.

Based only on this profiling summary, please:
(a) Describe what the dataset appears to represent.
(b) Call out data quality issues in plain English.
(c) Suggest 2–3 questions a user might want to ask of this data.

Be concise and practical. Do not invent values that aren't supported by the profiling summary.

PROFILING SUMMARY:
{summary}
"""

CHAT_SYSTEM = """You are a helpful data analyst assistant helping a user explore a dataset.
You only have access to the profiling summary below (not the raw data). Answer follow-up
questions using that summary. If something cannot be answered without the raw data, say so clearly.

PROFILING SUMMARY:
{summary}
"""


def analyze_with_claude(client: Anthropic, summary: str) -> str:
    message = client.messages.create(
        model=MODEL,
        max_tokens=1500,
        messages=[{"role": "user", "content": ANALYSIS_PROMPT.format(summary=summary)}],
    )
    return message.content[0].text


def stream_chat_reply(client: Anthropic, summary: str, question: str, history: list[dict[str, str]]):
    messages: list[dict[str, Any]] = []
    for turn in history:
        messages.append({"role": turn["role"], "content": turn["content"]})
    messages.append({"role": "user", "content": question})

    with client.messages.stream(
        model=MODEL,
        max_tokens=1500,
        system=CHAT_SYSTEM.format(summary=summary),
        messages=messages,
    ) as stream:
        for text in stream.text_stream:
            yield text


def profiles_to_display_df(profiles: list[dict[str, Any]]) -> pd.DataFrame:
    rows = []
    for p in profiles:
        rows.append(
            {
                "Column": p["column"],
                "Dtype": p["dtype"],
                "% Null": p["null_pct"],
                "Unique": p["unique_count"],
                "Min": p.get("min"),
                "Max": p.get("max"),
                "Mean": p.get("mean"),
                "Outliers (>3σ)": p.get("outlier_count"),
                "Outlier %": p.get("outlier_pct"),
            }
        )
    return pd.DataFrame(rows)


def main() -> None:
    st.set_page_config(page_title="AI Analyst", page_icon="📊", layout="wide")
    st.title("AI Analyst")
    st.caption("Upload a dataset for automated profiling and Claude-powered insights.")

    uploaded = st.file_uploader(
        "Upload a CSV or Excel file",
        type=["csv", "xlsx"],
        help="Accepted formats: .csv, .xlsx",
    )

    if uploaded is None:
        st.info("Upload a `.csv` or `.xlsx` file to get started.")
        return

    file_id = f"{uploaded.name}:{uploaded.size}"
    if st.session_state.get("file_id") != file_id:
        st.session_state.file_id = file_id
        st.session_state.pop("df", None)
        st.session_state.pop("profiles", None)
        st.session_state.pop("summary_text", None)
        st.session_state.pop("analysis", None)
        st.session_state.chat_history = []

    try:
        if "df" not in st.session_state:
            with st.spinner("Loading file…"):
                st.session_state.df = load_dataframe(uploaded)
        df: pd.DataFrame = st.session_state.df
    except Exception as exc:
        st.error(f"Failed to load file: {exc}")
        return

    if "profiles" not in st.session_state:
        with st.spinner("Profiling data…"):
            st.session_state.profiles = profile_dataframe(df)
            st.session_state.summary_text = profiling_summary_text(df, st.session_state.profiles)

    profiles = st.session_state.profiles
    summary_text = st.session_state.summary_text

    client = get_client()

    if "analysis" not in st.session_state:
        with st.spinner("Asking Claude to analyze the profiling summary…"):
            try:
                st.session_state.analysis = analyze_with_claude(client, summary_text)
            except Exception as exc:
                st.error(f"Claude API error: {exc}")
                return

    st.subheader("Claude analysis")
    st.markdown(st.session_state.analysis)

    st.subheader("Data preview")
    st.dataframe(df.head(100), use_container_width=True)
    st.caption(f"{len(df):,} rows × {len(df.columns)} columns (showing first 100 rows)")

    with st.expander("Profiling stats", expanded=False):
        st.dataframe(profiles_to_display_df(profiles), use_container_width=True)

    st.divider()
    st.subheader("Ask a follow-up question")

    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []

    for turn in st.session_state.chat_history:
        with st.chat_message(turn["role"]):
            st.markdown(turn["content"])

    question = st.chat_input("Ask about this dataset…")
    if question:
        st.session_state.chat_history.append({"role": "user", "content": question})
        with st.chat_message("user"):
            st.markdown(question)

        with st.chat_message("assistant"):
            try:
                reply = st.write_stream(
                    stream_chat_reply(
                        client,
                        summary_text,
                        question,
                        st.session_state.chat_history[:-1],
                    )
                )
            except Exception as exc:
                reply = f"Sorry, something went wrong talking to Claude: {exc}"
                st.error(reply)
        st.session_state.chat_history.append({"role": "assistant", "content": reply or ""})


if __name__ == "__main__":
    main()
