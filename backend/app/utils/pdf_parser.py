import pdfplumber
import re
import logging
from typing import List, Dict, Tuple

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def parse_mcq_pdf(file_path: str) -> Tuple[List[Dict], List[Dict]]:
    """
    Returns (questions, skipped) where:
      questions = list of valid MCQ dicts
      skipped   = list of {num, reason} for every question that could not be parsed
    """
    logger.info(f"PDF parse start: {file_path}")
    try:
        with pdfplumber.open(file_path) as pdf:
            lines = []
            for page in pdf.pages:
                text = page.extract_text()
                if not text:
                    continue
                for line in text.split("\n"):
                    stripped = line.strip()
                    if not stripped:
                        continue
                    if re.match(r'^-?\s*\d+\s*-?$', stripped):
                        continue
                    if re.match(r'^(page\s+\d+|pg\.?\s*\d+)$', stripped, re.I):
                        continue
                    lines.append(stripped)

        full = "\n".join(lines)

        questions, skipped = _parse_questions(full)

        # Fallback: collapse to single line and try again (only when nothing parsed)
        if not questions and not skipped:
            logger.info("Block parse found 0 — trying flat fallback")
            questions = _flat_parse(full)

    except Exception as e:
        logger.error(f"PDF parse error: {e}")
        raise

    logger.info(f"Extracted {len(questions)} questions, skipped {len(skipped)}")
    return questions, skipped


def _parse_questions(text: str) -> Tuple[List[Dict], List[Dict]]:
    text = re.sub(r'\n{3,}', '\n\n', text)

    q_start = re.compile(
        r'(?m)^[ \t]*(?:Q\.?\s*)?(\d+)\s*[\.:\)]\s+',
    )
    matches = list(q_start.finditer(text))
    if not matches:
        return [], []

    blocks = []
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        num = int(m.group(1))
        blocks.append((num, text[m.start():end]))

    questions = []
    skipped = []
    for num, block in blocks:
        result = _parse_block(block)
        if isinstance(result, dict) and 'question_text' in result:
            questions.append(result)
        else:
            # result is a skip-reason string
            skipped.append({"num": num, "reason": result})

    logger.info(f"Block parser: {len(questions)}/{len(blocks)} parsed, {len(skipped)} skipped")
    return questions, skipped


def _parse_block(block: str):
    """
    Returns a valid MCQ dict on success, or a plain string describing why it failed.
    """
    # ── 1. Extract question text ──────────────────────────────────────────────
    opt_start = re.search(
        r'(?m)^[ \t]*[\(\[]?[A-D][\)\]\.\s]',
        block
    )
    if not opt_start:
        return "No option markers (A/B/C/D) found"

    q_raw = block[:opt_start.start()].strip()
    q_text = re.sub(r'^(?:Q\.?\s*)?\d+\s*[\.:\)]\s*', '', q_raw, flags=re.I).strip()
    if len(q_text) < 5:
        return "Question text is too short or missing"

    remainder = block[opt_start.start():]

    # ── 2. Extract answer line ────────────────────────────────────────────────
    ans_re = re.compile(
        r'(?:Answer|Ans(?:wer)?|Correct(?:\s*Answer)?|Key|Solution)\s*[:\-]?\s*[\(\[]?\s*([A-D])\s*[\)\]]?',
        re.IGNORECASE
    )
    ans_match = ans_re.search(remainder)
    correct = ans_match.group(1).upper() if ans_match else None
    if not correct:
        return "Answer line missing — add 'Answer: A' (or B/C/D) after the options"

    remainder_clean = ans_re.sub('', remainder)

    # ── 3. Extract options A B C D ────────────────────────────────────────────
    opt_split = re.compile(
        r'(?m)(?:^|\n)[ \t]*[\(\[]?([A-D])[\)\]\.\s]\s*',
        re.IGNORECASE
    )
    parts = opt_split.split(remainder_clean)

    # Strip any next-question bleed from the last option's content
    next_q_re = re.compile(r'(?m)^[ \t]*(?:Q\.?\s*)?\d+\s*[\.:\)]\s+')

    options: Dict[str, str] = {}
    i = 1
    while i < len(parts) - 1:
        letter = parts[i].upper()
        content = parts[i + 1] if i + 1 < len(parts) else ''
        if letter in ('A', 'B', 'C', 'D'):
            # Cut off anything that looks like the start of the next question
            nq = next_q_re.search(content)
            if nq:
                content = content[:nq.start()]
            cleaned = _clean(content)
            if cleaned:
                options[letter] = cleaned
        i += 2

    def _all_present(opts):
        return all(k in opts and opts[k] for k in ('A', 'B', 'C', 'D'))

    if not _all_present(options):
        # Last-resort inline attempt
        options = _extract_inline_options(remainder_clean)
        if not _all_present(options):
            missing = [k for k in ('A', 'B', 'C', 'D') if k not in options or not options.get(k)]
            if missing:
                return f"Option{'s' if len(missing) > 1 else ''} {', '.join(missing)} {'are' if len(missing) > 1 else 'is'} empty or missing"
            return "Could not extract all four options"

    return {
        "question_text": _clean(q_text),
        "option_a": options['A'],
        "option_b": options['B'],
        "option_c": options['C'],
        "option_d": options['D'],
        "correct_option": correct,
        "marks": 1.0,
    }


def _extract_inline_options(text: str) -> Dict[str, str]:
    """Handle options all on one line: A) foo B) bar C) baz D) qux"""
    pattern = re.compile(
        r'[\(\[]?A[\)\]\.\s]\s*(.*?)\s+'
        r'[\(\[]?B[\)\]\.\s]\s*(.*?)\s+'
        r'[\(\[]?C[\)\]\.\s]\s*(.*?)\s+'
        r'[\(\[]?D[\)\]\.\s]\s*(.*?)(?:\s+|$)',
        re.IGNORECASE | re.DOTALL
    )
    m = pattern.search(text)
    if m:
        return {
            'A': _clean(m.group(1)),
            'B': _clean(m.group(2)),
            'C': _clean(m.group(3)),
            'D': _clean(m.group(4)),
        }
    return {}


def _clean(text: str) -> str:
    text = text.strip()
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{2,}', '\n', text)
    return text.strip()


def _flat_parse(text: str) -> List[Dict]:
    """Last-resort fallback — no skip tracking, just returns what matches."""
    flat = re.sub(r'\s+', ' ', text)

    pattern = re.compile(
        r'(?:Q\.?\s*)?\d+\s*[\.:\)]\s+(.*?)'
        r'\s+[\(\[]?A[\)\]\.\s]\s+(.*?)'
        r'\s+[\(\[]?B[\)\]\.\s]\s+(.*?)'
        r'\s+[\(\[]?C[\)\]\.\s]\s+(.*?)'
        r'\s+[\(\[]?D[\)\]\.\s]\s+(.*?)'
        r'\s+(?:Answer|Ans(?:wer)?|Correct(?:\s*Answer)?|Key)\s*[:\-]?\s*[\(\[]?([A-D])[\)\]]?(?=\s|$)',
        re.IGNORECASE
    )

    results = []
    for m in pattern.finditer(flat):
        q_text = re.sub(r'^(?:Q\.?\s*)?\d+\s*[\.:\)]\s*', '', m.group(1), flags=re.I).strip()
        if q_text and all(m.group(i) for i in range(2, 6)):
            results.append({
                "question_text": q_text,
                "option_a": m.group(2).strip(),
                "option_b": m.group(3).strip(),
                "option_c": m.group(4).strip(),
                "option_d": m.group(5).strip(),
                "correct_option": m.group(6).upper(),
                "marks": 1.0,
            })
    return results
