import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../store/theme_provider.dart';

class PhotoUpload extends ConsumerStatefulWidget {
  const PhotoUpload({super.key, required this.value, required this.onChange});
  final String? value; // data URL
  final ValueChanged<String?> onChange;

  @override
  ConsumerState<PhotoUpload> createState() => _PhotoUploadState();
}

class _PhotoUploadState extends ConsumerState<PhotoUpload> {
  final _picker = ImagePicker();
  String? _error;

  Future<void> _pick(ImageSource source) async {
    try {
      final picked = await _picker.pickImage(
        source: source,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );
      if (picked == null) return;
      final bytes = await File(picked.path).readAsBytes();
      if (bytes.length > 4 * 1024 * 1024) {
        setState(() => _error = 'Image must be under 4 MB');
        return;
      }
      final base64Str = base64Encode(bytes);
      widget.onChange('data:image/jpeg;base64,$base64Str');
      setState(() => _error = null);
    } catch (e) {
      setState(() => _error = 'Could not load image');
    }
  }

  void _showSheet() {
    final isDark = ref.read(themeProvider) == ThemeMode.dark;
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.2) : Colors.black.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.photo_library_rounded, color: Color(0xFFEA580C)),
              title: const Text('Choose from gallery', style: TextStyle(fontWeight: FontWeight.w600)),
              onTap: () {
                Navigator.pop(context);
                _pick(ImageSource.gallery);
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt_rounded, color: Color(0xFFEA580C)),
              title: const Text('Take a photo', style: TextStyle(fontWeight: FontWeight.w600)),
              onTap: () {
                Navigator.pop(context);
                _pick(ImageSource.camera);
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final hasPhoto = widget.value != null && widget.value!.isNotEmpty;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TweenAnimationBuilder<double>(
          tween: Tween(begin: 0.9, end: 1),
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOutBack,
          builder: (_, t, child) => Transform.scale(scale: t, child: child),
          child: Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              color: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
              border: Border.all(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.12)
                    : const Color(0xFFE4E4E7),
                width: 2,
                style: BorderStyle.solid,
              ),
            ),
            child: hasPhoto
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(18),
                    child: Image.memory(
                      base64Decode(widget.value!.split(',').last),
                      fit: BoxFit.cover,
                    ),
                  )
                : Icon(
                    Icons.camera_alt_rounded,
                    size: 30,
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.45)
                        : const Color(0xFFA1A1AA),
                  ),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Passport-size photo',
                style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : const Color(0xFF09090B),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Front-facing, plain background. PNG or JPG, up to 4 MB.',
                style: TextStyle(
                  fontSize: 11.5,
                  height: 1.4,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.6)
                      : const Color(0xFF71717A),
                ),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ElevatedButton.icon(
                    onPressed: _showSheet,
                    icon: const Icon(Icons.upload_rounded, size: 14),
                    label: Text(
                      hasPhoto ? 'Replace' : 'Upload',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF97316),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                      elevation: 4,
                      shadowColor: const Color(0xFFF97316).withValues(alpha: 0.4),
                    ),
                  ),
                  if (hasPhoto)
                    OutlinedButton.icon(
                      onPressed: () => widget.onChange(null),
                      icon: const Icon(Icons.delete_outline_rounded, size: 14, color: Color(0xFFE11D48)),
                      label: const Text(
                        'Remove',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFFE11D48)),
                      ),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.15)
                              : const Color(0xFFE4E4E7),
                        ),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                    ),
                ],
              ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(_error!, style: const TextStyle(fontSize: 11, color: Color(0xFFEF4444))),
                ),
            ],
          ),
        ),
      ],
    );
  }
}
