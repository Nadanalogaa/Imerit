import 'dart:convert';
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../store/theme_provider.dart';

/// CV upload widget mirroring web's About-You / Personal CV control.
/// Accepts PDF / DOC / DOCX up to 5 MB, encodes as a `data:` URL so the
/// backend can persist the whole file inline on the CandidateProfile row
/// (same wire format as the passport photo). No cloud storage yet — this
/// keeps parity with web until we wire up S3.
class CvUpload extends ConsumerStatefulWidget {
  const CvUpload({
    super.key,
    required this.value,
    required this.fileName,
    required this.onChange,
  });
  final String? value; // data URL
  final String? fileName;
  final void Function(String? dataUrl, String? fileName) onChange;

  @override
  ConsumerState<CvUpload> createState() => _CvUploadState();
}

class _CvUploadState extends ConsumerState<CvUpload> {
  String? _error;
  bool _busy = false;

  static const _maxBytes = 5 * 1024 * 1024; // 5 MB

  Future<void> _pick() async {
    setState(() {
      _error = null;
      _busy = true;
    });
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx'],
        withData: true,
      );
      if (result == null || result.files.isEmpty) {
        setState(() => _busy = false);
        return;
      }
      final f = result.files.single;
      // `withData: true` gives us bytes on all platforms; fall back to
      // reading the path if the plugin decided to stream instead.
      final bytes = f.bytes ?? (f.path != null ? await File(f.path!).readAsBytes() : null);
      if (bytes == null) {
        setState(() {
          _busy = false;
          _error = 'Could not read the file. Try picking it again.';
        });
        return;
      }
      if (bytes.length > _maxBytes) {
        setState(() {
          _busy = false;
          _error = 'File must be under 5 MB (yours is ${(bytes.length / (1024 * 1024)).toStringAsFixed(1)} MB).';
        });
        return;
      }
      final ext = (f.extension ?? '').toLowerCase();
      final mime = switch (ext) {
        'pdf' => 'application/pdf',
        'doc' => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        _ => 'application/octet-stream',
      };
      final b64 = base64Encode(bytes);
      widget.onChange('data:$mime;base64,$b64', f.name);
      setState(() => _busy = false);
    } catch (e) {
      setState(() {
        _busy = false;
        _error = 'Upload failed. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final hasCv = widget.value != null && widget.value!.isNotEmpty;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFFF97316).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.description_rounded, size: 20, color: Color(0xFFEA580C)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      hasCv ? (widget.fileName ?? 'CV attached') : 'Upload CV (optional)',
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white : const Color(0xFF09090B),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      hasCv
                          ? 'Employers can download this on your public profile.'
                          : 'PDF, DOC or DOCX. Up to 5 MB.',
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF71717A),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ElevatedButton.icon(
                onPressed: _busy ? null : _pick,
                icon: _busy
                    ? const SizedBox(
                        width: 12,
                        height: 12,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.upload_rounded, size: 14),
                label: Text(
                  hasCv ? 'Replace' : 'Upload',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF97316),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                  elevation: 4,
                  shadowColor: const Color(0xFFF97316).withValues(alpha: 0.4),
                ),
              ),
              if (hasCv)
                OutlinedButton.icon(
                  onPressed: () => widget.onChange(null, null),
                  icon: const Icon(Icons.delete_outline_rounded, size: 14, color: Color(0xFFE11D48)),
                  label: const Text('Remove',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFFE11D48))),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.15) : const Color(0xFFE4E4E7)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                  ),
                ),
            ],
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(_error!, style: const TextStyle(fontSize: 11, color: Color(0xFFE11D48))),
            ),
        ],
      ),
    );
  }
}
