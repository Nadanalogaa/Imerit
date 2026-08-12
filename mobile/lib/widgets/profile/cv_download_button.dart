import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

/// Small download-CV control that appears wherever an employer, admin,
/// or the candidate themselves can grab the uploaded CV file. Decodes
/// the `data:` URL to bytes, writes to a temporary file, and hands it
/// to the OS share sheet (Files.app on iOS, Share dialog on Android).
///
/// Web has a plain `<a href=data:>` for this; mobile needs the round-
/// trip through the filesystem since the OS won't open bare data URLs.
class CvDownloadButton extends StatefulWidget {
  const CvDownloadButton({
    super.key,
    required this.dataUrl,
    required this.fileName,
    this.compact = false,
  });

  final String dataUrl;
  final String? fileName;
  /// Small-in-a-strip variant with a shorter label. Defaults to false
  /// (the full pill button).
  final bool compact;

  @override
  State<CvDownloadButton> createState() => _CvDownloadButtonState();
}

class _CvDownloadButtonState extends State<CvDownloadButton> {
  bool _busy = false;

  Future<void> _download() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      // Parse `data:<mime>;base64,<payload>` — tolerate extra parameters
      // between the mime and the base64 marker.
      final match = RegExp(r'^data:([^;,]+)(?:;[^,]*)?,(.*)$').firstMatch(widget.dataUrl);
      if (match == null) {
        _snack('CV file is malformed. Ask the candidate to re-upload.');
        return;
      }
      final mime = match.group(1) ?? 'application/octet-stream';
      final payload = match.group(2) ?? '';
      final bytes = base64Decode(payload);
      final dir = await getTemporaryDirectory();
      final name = _safeName(widget.fileName, mime);
      final f = File('${dir.path}/$name');
      await f.writeAsBytes(bytes, flush: true);
      // ignore: use_build_context_synchronously
      final box = context.findRenderObject() as RenderBox?;
      await Share.shareXFiles(
        [XFile(f.path, mimeType: mime, name: name)],
        subject: 'CV — ${widget.fileName ?? name}',
        sharePositionOrigin: box == null
            ? null
            : box.localToGlobal(Offset.zero) & box.size,
      );
    } catch (_) {
      _snack('Could not open CV. Try again.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String _safeName(String? original, String mime) {
    if (original != null && original.trim().isNotEmpty) return original.trim();
    final ext = switch (mime) {
      'application/pdf' => 'pdf',
      'application/msword' => 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
      _ => 'bin',
    };
    return 'candidate-cv.$ext';
  }

  void _snack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    if (widget.compact) {
      return TextButton.icon(
        onPressed: _busy ? null : _download,
        icon: _busy
            ? const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2))
            : const Icon(Icons.download_rounded, size: 14),
        label: const Text('CV', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800)),
        style: TextButton.styleFrom(
          foregroundColor: const Color(0xFFEA580C),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
          backgroundColor: const Color(0xFFF97316).withValues(alpha: 0.10),
        ),
      );
    }
    return ElevatedButton.icon(
      onPressed: _busy ? null : _download,
      icon: _busy
          ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : const Icon(Icons.download_rounded, size: 16),
      label: Text(
        widget.fileName == null ? 'Download CV' : 'Download CV — ${widget.fileName}',
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800),
      ),
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFFF97316),
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        elevation: 4,
        shadowColor: const Color(0xFFF97316).withValues(alpha: 0.4),
      ),
    );
  }
}
