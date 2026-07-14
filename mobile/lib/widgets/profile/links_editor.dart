import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../store/profile_provider.dart';
import '../../store/theme_provider.dart';

/// Portfolio / social links editor. Mirrors the web `LinksSection`
/// component — free-form label + URL pairs. Handy for LinkedIn, GitHub,
/// Behance, personal site, or any "Other" reference the candidate wants
/// employers to see.
///
/// Interactivity: presets for common platforms (auto-fill the label +
/// prefill the URL scheme), animated add/remove, and inline URL
/// validation with a live open-in-browser affordance.
class LinksEditor extends ConsumerWidget {
  const LinksEditor({
    super.key,
    required this.value,
    required this.onChange,
  });

  final List<ProfileLink> value;
  final ValueChanged<List<ProfileLink>> onChange;

  void _add(ProfileLink link) {
    onChange([...value, link]);
  }

  void _remove(int index) {
    final next = [...value]..removeAt(index);
    onChange(next);
  }

  void _update(int index, ProfileLink next) {
    final list = [...value];
    list[index] = next;
    onChange(list);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AnimatedSize(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
          child: Column(
            children: List.generate(value.length, (i) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _LinkRow(
                  key: ValueKey('link_$i'),
                  link: value[i],
                  isDark: isDark,
                  onUpdate: (next) => _update(i, next),
                  onRemove: () => _remove(i),
                ),
              );
            }),
          ),
        ),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: [
            _PresetChip(
              label: 'LinkedIn',
              icon: Icons.business_center_rounded,
              color: const Color(0xFF0A66C2),
              onTap: () => _add(const ProfileLink(label: 'LinkedIn', url: 'https://linkedin.com/in/')),
              disabled: value.any((l) => l.label.toLowerCase() == 'linkedin'),
            ),
            _PresetChip(
              label: 'GitHub',
              icon: Icons.code_rounded,
              color: const Color(0xFF24292E),
              onTap: () => _add(const ProfileLink(label: 'GitHub', url: 'https://github.com/')),
              disabled: value.any((l) => l.label.toLowerCase() == 'github'),
            ),
            _PresetChip(
              label: 'Portfolio',
              icon: Icons.web_rounded,
              color: const Color(0xFFF97316),
              onTap: () => _add(const ProfileLink(label: 'Portfolio', url: 'https://')),
              disabled: value.any((l) => l.label.toLowerCase() == 'portfolio'),
            ),
            _PresetChip(
              label: 'Behance',
              icon: Icons.palette_rounded,
              color: const Color(0xFF1769FF),
              onTap: () => _add(const ProfileLink(label: 'Behance', url: 'https://behance.net/')),
              disabled: value.any((l) => l.label.toLowerCase() == 'behance'),
            ),
            _PresetChip(
              label: 'Other',
              icon: Icons.add_link_rounded,
              color: const Color(0xFF7C3AED),
              onTap: () => _add(const ProfileLink(label: '', url: '')),
            ),
          ],
        ),
      ],
    );
  }
}

class _LinkRow extends StatefulWidget {
  const _LinkRow({
    super.key,
    required this.link,
    required this.isDark,
    required this.onUpdate,
    required this.onRemove,
  });

  final ProfileLink link;
  final bool isDark;
  final ValueChanged<ProfileLink> onUpdate;
  final VoidCallback onRemove;

  @override
  State<_LinkRow> createState() => _LinkRowState();
}

class _LinkRowState extends State<_LinkRow> {
  late final TextEditingController _label;
  late final TextEditingController _url;

  @override
  void initState() {
    super.initState();
    _label = TextEditingController(text: widget.link.label);
    _url = TextEditingController(text: widget.link.url);
  }

  @override
  void dispose() {
    _label.dispose();
    _url.dispose();
    super.dispose();
  }

  void _push() {
    widget.onUpdate(ProfileLink(label: _label.text.trim(), url: _url.text.trim()));
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7),
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: const Color(0xFF7C3AED).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.link_rounded, size: 16, color: Color(0xFF7C3AED)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: _label,
                  onChanged: (_) => _push(),
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF09090B)),
                  decoration: InputDecoration(
                    hintText: 'Label (e.g. LinkedIn, Portfolio)',
                    hintStyle: TextStyle(fontSize: 12.5, color: isDark ? Colors.white.withValues(alpha: 0.3) : const Color(0xFFA1A1AA)),
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                    border: InputBorder.none,
                  ),
                ),
              ),
              InkWell(
                onTap: () {
                  HapticFeedback.lightImpact();
                  widget.onRemove();
                },
                borderRadius: BorderRadius.circular(999),
                child: Padding(
                  padding: const EdgeInsets.all(4),
                  child: Icon(Icons.close_rounded, size: 16, color: isDark ? Colors.white.withValues(alpha: 0.5) : const Color(0xFFA1A1AA)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _url,
            onChanged: (_) => _push(),
            keyboardType: TextInputType.url,
            style: TextStyle(fontSize: 12.5, color: isDark ? Colors.white.withValues(alpha: 0.8) : const Color(0xFF52525B)),
            decoration: InputDecoration(
              hintText: 'https://...',
              hintStyle: TextStyle(fontSize: 12, color: isDark ? Colors.white.withValues(alpha: 0.3) : const Color(0xFFA1A1AA)),
              filled: true,
              fillColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFF7C3AED), width: 1.4),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PresetChip extends StatelessWidget {
  const _PresetChip({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
    this.disabled = false,
  });
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  final bool disabled;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: disabled
            ? null
            : () {
                HapticFeedback.selectionClick();
                onTap();
              },
        borderRadius: BorderRadius.circular(999),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: disabled ? const Color(0xFFF4F4F5) : color.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: disabled ? const Color(0xFFE4E4E7) : color.withValues(alpha: 0.30),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 12, color: disabled ? const Color(0xFFA1A1AA) : color),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: disabled ? const Color(0xFFA1A1AA) : color,
                ),
              ),
              if (!disabled) ...[
                const SizedBox(width: 4),
                Icon(Icons.add_rounded, size: 12, color: color),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
