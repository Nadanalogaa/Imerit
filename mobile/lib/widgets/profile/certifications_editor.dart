import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../store/profile_provider.dart';
import '../../store/theme_provider.dart';

/// Certifications editor for the candidate profile wizard. Mirrors the
/// web CertificationsEditor: name (required), issuer, issued / expiry
/// year, credential id, and credential URL. On save the whole list is
/// sent to PUT /candidate/profile/certifications via the profile store.
class CertificationsEditor extends ConsumerWidget {
  const CertificationsEditor({super.key, required this.value, required this.onChange});

  final List<Certification> value;
  final ValueChanged<List<Certification>> onChange;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (int i = 0; i < value.length; i++) ...[
          _CertCard(
            key: ValueKey('cert-$i'),
            cert: value[i],
            isDark: isDark,
            onChange: (next) {
              final list = [...value];
              list[i] = next;
              onChange(list);
            },
            onRemove: () {
              final list = [...value]..removeAt(i);
              onChange(list);
            },
          ),
          const SizedBox(height: 10),
        ],
        OutlinedButton.icon(
          onPressed: () => onChange([...value, const Certification(name: '')]),
          icon: const Icon(Icons.add_rounded, size: 16),
          label: const Text('Add certification', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800)),
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFFEA580C),
            side: const BorderSide(color: Color(0xFFF97316), width: 1.4),
            padding: const EdgeInsets.symmetric(vertical: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
        ),
      ],
    );
  }
}

class _CertCard extends StatefulWidget {
  const _CertCard({
    super.key,
    required this.cert,
    required this.isDark,
    required this.onChange,
    required this.onRemove,
  });
  final Certification cert;
  final bool isDark;
  final ValueChanged<Certification> onChange;
  final VoidCallback onRemove;

  @override
  State<_CertCard> createState() => _CertCardState();
}

class _CertCardState extends State<_CertCard> {
  late final TextEditingController _name;
  late final TextEditingController _issuer;
  late final TextEditingController _issued;
  late final TextEditingController _expiry;
  late final TextEditingController _credId;
  late final TextEditingController _credUrl;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: widget.cert.name);
    _issuer = TextEditingController(text: widget.cert.issuer ?? '');
    _issued = TextEditingController(text: widget.cert.issuedYear?.toString() ?? '');
    _expiry = TextEditingController(text: widget.cert.expiryYear?.toString() ?? '');
    _credId = TextEditingController(text: widget.cert.credentialId ?? '');
    _credUrl = TextEditingController(text: widget.cert.credentialUrl ?? '');
  }

  @override
  void dispose() {
    _name.dispose();
    _issuer.dispose();
    _issued.dispose();
    _expiry.dispose();
    _credId.dispose();
    _credUrl.dispose();
    super.dispose();
  }

  Certification _snapshot() => Certification(
        name: _name.text.trim(),
        issuer: _issuer.text.trim().isEmpty ? null : _issuer.text.trim(),
        issuedYear: int.tryParse(_issued.text.trim()),
        expiryYear: int.tryParse(_expiry.text.trim()),
        credentialId: _credId.text.trim().isEmpty ? null : _credId.text.trim(),
        credentialUrl: _credUrl.text.trim().isEmpty ? null : _credUrl.text.trim(),
      );

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF09090B) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.10) : const Color(0xFFE4E4E7)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Icon(Icons.workspace_premium_rounded, size: 16, color: Color(0xFFEA580C)),
              const SizedBox(width: 6),
              const Expanded(
                child: Text('Certification', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: Color(0xFF3F3F46))),
              ),
              IconButton(
                onPressed: widget.onRemove,
                icon: const Icon(Icons.close_rounded, size: 16, color: Color(0xFFE11D48)),
                visualDensity: VisualDensity.compact,
                tooltip: 'Remove certification',
              ),
            ],
          ),
          _field(_name, 'Certificate name', isDark, onChanged: (_) => widget.onChange(_snapshot())),
          const SizedBox(height: 8),
          _field(_issuer, 'Issuing body (optional)', isDark, onChanged: (_) => widget.onChange(_snapshot())),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _field(_issued, 'Issued year', isDark,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(4)],
                    onChanged: (_) => widget.onChange(_snapshot())),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _field(_expiry, 'Expires (optional)', isDark,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(4)],
                    onChanged: (_) => widget.onChange(_snapshot())),
              ),
            ],
          ),
          const SizedBox(height: 8),
          _field(_credId, 'Credential ID (optional)', isDark, onChanged: (_) => widget.onChange(_snapshot())),
          const SizedBox(height: 8),
          _field(_credUrl, 'Credential URL (optional)', isDark, keyboardType: TextInputType.url, onChanged: (_) => widget.onChange(_snapshot())),
        ],
      ),
    );
  }

  Widget _field(TextEditingController c, String label, bool isDark,
      {TextInputType? keyboardType,
      List<TextInputFormatter>? inputFormatters,
      ValueChanged<String>? onChanged}) {
    return TextField(
      controller: c,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      onChanged: onChanged,
      style: TextStyle(fontSize: 13, color: isDark ? Colors.white : const Color(0xFF09090B)),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(
          fontSize: 12,
          color: isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A),
        ),
        isDense: true,
        filled: true,
        fillColor: isDark ? const Color(0xFF18181B) : const Color(0xFFFAFAFA),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.10) : const Color(0xFFE4E4E7)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.10) : const Color(0xFFE4E4E7)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFF97316), width: 1.4),
        ),
      ),
    );
  }
}
