"""Speech text helpers for browser text-to-speech output."""

import re


def prepare_spoken_reply(reply):
    """Convert a chat reply into a natural, shorter version for speech."""

    if not reply:
        return ""

    without_code = re.sub(
        r"```(?:\w+)?\s*[\s\S]*?```",
        "I added the code example in the chat, so you can read it clearly there.",
        reply,
    )
    without_inline_code = re.sub(r"`([^`]+)`", r"\1", without_code)
    without_markdown = without_inline_code.replace("**", "").replace("__", "")
    without_extra_space = re.sub(r"\s+", " ", without_markdown).strip()

    return without_extra_space
