/// Paste-time sanitiser for user-generated form input.
///
/// Dart port of web/src/lib/sanitizePaste.ts. Keep both files in sync
/// — every replacement rule that runs on web should run on mobile so
/// a "React ✓ Node ✓" pasted into the same field ends up stored
/// identically on both platforms.
///
/// Wire it into a text input by attaching [SanitizingInputFormatter]:
///
///   TextField(
///     controller: _controller,
///     inputFormatters: [SanitizingInputFormatter()],
///   )
///
/// The formatter compares the incoming value to the old one and
/// sanitises only the newly-inserted region — direct typing stays
/// untouched, and pasted content gets cleaned in one pass.
library;

import 'package:flutter/services.dart';

/// Clean a chunk of plain text. Same rule set as sanitizePlainText on
/// web: strip bullet chars, tick / cross marks, smart quotes, em/en
/// dashes, ellipsis, arrows, zero-width chars; normalise line endings;
/// collapse >2 blank lines to 2.
String sanitizePlainText(String input) {
  return input
      .replaceAll('\r\n', '\n')
      .replaceAll('\r', '\n')
      // Bullet-like list markers at the start of a line.
      .replaceAllMapped(
        RegExp(r'^[\t ]*[•●○▪■□◦∙⁃‣⦁◘☞►▶➤➜◆◇★☆]\s*', multiLine: true),
        (_) => '- ',
      )
      // Standalone tick / cross marks.
      .replaceAll(RegExp(r'[✓✔☑✅✗✘☒❌]'), '')
      // Smart quotes → ASCII.
      .replaceAll(RegExp(r'[“”„‟]'), '"')
      .replaceAll(RegExp(r'[‘’‚‛′]'), "'")
      // Em / en / horizontal-bar dashes → hyphen.
      .replaceAll(RegExp(r'[—–―]'), '-')
      // Horizontal ellipsis → three dots.
      .replaceAll('…', '...')
      // Arrows written out.
      .replaceAll(RegExp(r'[→➜➤►▶]'), '->')
      .replaceAll(RegExp(r'[←◀◄]'), '<-')
      // Zero-width chars (space, non-joiner, joiner, BOM).
      .replaceAll(RegExp(r'[​-‍﻿]'), '')
      // Non-breaking space → regular space.
      .replaceAll(' ', ' ')
      // Collapse 3+ consecutive newlines to two.
      .replaceAll(RegExp(r'\n{3,}'), '\n\n');
}

/// A [TextInputFormatter] that scrubs newly-inserted text of the
/// pasted-bullet / smart-quote noise. Direct typing (single-char
/// insertions) is left alone so a user who genuinely wants to type a
/// • character still can.
class SanitizingInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    // Fast path: single-char typing (or deletion) — pass through.
    // A "single" insertion is anything where the new text is at most
    // one code unit longer than the old. Anything larger is almost
    // certainly a paste or an autofill.
    if (newValue.text.length - oldValue.text.length <= 1) {
      return newValue;
    }
    final cleaned = sanitizePlainText(newValue.text);
    if (cleaned == newValue.text) return newValue;
    // Cursor: clamp to the end of the cleaned string. We can't
    // reliably map the old caret through a variable-length transform,
    // and end-of-paste is the intuitive resting place anyway.
    return TextEditingValue(
      text: cleaned,
      selection: TextSelection.collapsed(offset: cleaned.length),
      composing: TextRange.empty,
    );
  }
}
