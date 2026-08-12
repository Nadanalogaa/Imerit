/**
 * Paste-time sanitizer for user-generated form input.
 *
 * WHY THIS EXISTS
 * Users routinely paste content from Word, Google Docs, PDFs, LinkedIn,
 * WhatsApp, etc. into our text fields. That content carries a lot of
 * baggage: bullet characters (•), tick marks (✓), smart quotes (" "),
 * em-dashes (—), zero-width spaces, Windows line endings, and so on.
 * When those characters land in a job description or profile bio they
 * make the field render inconsistently across candidates + employers
 * and mangle search-text matching.
 *
 * This module strips the noise + normalises the survivors, and exposes
 * `handlePasteSanitized` — an onPaste handler that plugs straight into
 * an <input> or <textarea> without breaking cursor position.
 *
 * The sanitizer runs ONLY on paste. Direct typing is left alone —
 * users who genuinely want to type a • character can, without the
 * field silently rewriting it under them.
 */

import type { ClipboardEvent as ReactClipboardEvent } from "react";

/**
 * Clean a chunk of plain text.
 *
 *  - `\r\n` and `\r` → `\n` (Windows / Mac Classic line endings)
 *  - Any leading bullet-ish char on a line → `- ` (Markdown-style dash)
 *  - Standalone tick / cross marks → removed
 *  - Smart quotes and typographic dashes → their ASCII cousins
 *  - Ellipsis (…) → three dots
 *  - Zero-width chars + BOM → gone
 *  - Non-breaking space (U+00A0) → regular space
 *  - Runs of 3+ blank lines collapsed to 2
 */
export function sanitizePlainText(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Bullet-like list markers at the start of a line — the space AFTER
    // the marker is optional so `•foo` → `- foo` and `•  foo` → `- foo`
    // stay tidy. Covers the common ones from Office + Google Docs.
    .replace(/^[\t ]*[•●○▪■□◦∙⁃‣⦁◘☞►▶➤➜◆◇★☆]\s*/gm, "- ")
    // Standalone tick / cross marks — usually decorative in pasted text.
    // Strip them entirely; the surrounding text keeps its meaning.
    .replace(/[✓✔☑✅✗✘☒❌]/g, "")
    // Typographic quotes and apostrophes → ASCII.
    .replace(/[“”„‟]/g, '"')
    .replace(/[‘’‚‛′]/g, "'")
    // Em / en / horizontal-bar dashes → hyphen.
    .replace(/[—–―]/g, "-")
    // Horizontal ellipsis → three dots.
    .replace(/…/g, "...")
    // Directional arrows commonly used as "leads to" — write them out.
    .replace(/[→➜➤►▶]/g, "->")
    .replace(/[←◀◄]/g, "<-")
    // Zero-width characters (space, non-joiner, joiner) + BOM. These
    // often ride along with pasted content from PDFs and RTL contexts,
    // and they break naive `.length` / `includes` checks downstream.
    .replace(/[​-‍﻿]/g, "")
    // Non-breaking space → regular space.
    .replace(/ /g, " ")
    // Collapse 3+ consecutive newlines to two so pasted content doesn't
    // leave giant vertical gaps.
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * onPaste handler for a controlled <input> or <textarea>. Sanitises the
 * clipboard text, then splices it into the current selection while
 * restoring the caret position after React re-renders.
 *
 * Usage:
 *   <textarea
 *     value={value}
 *     onChange={(e) => setValue(e.target.value)}
 *     onPaste={(e) => handlePasteSanitized(e, setValue)}
 *   />
 *
 * If the pasted text is already clean the handler is a no-op — the
 * browser's default paste behaviour runs, and cursor position is
 * whatever the browser decides.
 */
export function handlePasteSanitized(
  e: ReactClipboardEvent<HTMLTextAreaElement | HTMLInputElement>,
  onChange: (value: string) => void,
): void {
  const raw = e.clipboardData.getData("text/plain");
  if (!raw) return;
  const cleaned = sanitizePlainText(raw);
  if (cleaned === raw) return;

  e.preventDefault();
  const el = e.currentTarget;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const before = el.value.slice(0, start);
  const after = el.value.slice(end);
  const next = before + cleaned + after;
  onChange(next);

  // Restore caret AFTER the value prop has propagated back through
  // React. rAF is one animation-frame away from now — long enough
  // for the controlled re-render, short enough to stay in the same
  // user-input tick.
  const nextCaret = before.length + cleaned.length;
  requestAnimationFrame(() => {
    try {
      el.setSelectionRange(nextCaret, nextCaret);
    } catch {
      // Certain input types (email, number, etc.) don't support
      // programmatic selection ranges; swallow the DOMException.
    }
  });
}
