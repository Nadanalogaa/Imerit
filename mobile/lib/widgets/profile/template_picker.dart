import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../store/theme_provider.dart';
import '../templates/template_data.dart';
import '../templates/render_template.dart';

class TemplatePicker extends ConsumerWidget {
  const TemplatePicker({
    super.key,
    required this.data,
    required this.selected,
    required this.onSelect,
  });

  final TemplateData data;
  final String? selected;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Hint banner
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            gradient: isDark
                ? LinearGradient(colors: [
                    const Color(0xFF8B5CF6).withValues(alpha: 0.10),
                    const Color(0xFFEC4899).withValues(alpha: 0.05),
                  ])
                : const LinearGradient(colors: [Color(0xFFF5F3FF), Color(0xFFFDF2F8)]),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark
                  ? const Color(0xFF8B5CF6).withValues(alpha: 0.2)
                  : const Color(0xFFE9D5FF),
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.visibility_rounded, size: 18, color: Color(0xFF7C3AED)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Pick a profile design. The preview below uses your real details — switch templates anytime.',
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.45,
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.85)
                        : const Color(0xFF52525B),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Gallery — horizontal scroll of design swatches (no live render here)
        SizedBox(
          height: 200,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _swatches.length,
            separatorBuilder: (_, _) => const SizedBox(width: 10),
            itemBuilder: (_, i) {
              final s = _swatches[i];
              final isSel = s.id == selected;
              return _SwatchCard(
                swatch: s,
                isSelected: isSel,
                isDark: isDark,
                onTap: () => onSelect(s.id),
              );
            },
          ),
        ),
        const SizedBox(height: 18),

        // Live preview — scales 800-wide template down to fit screen
        if (selected != null) ...[
          Row(
            children: [
              const Icon(Icons.visibility_rounded, size: 14, color: Color(0xFFEA580C)),
              const SizedBox(width: 6),
              const Text(
                'LIVE PREVIEW',
                style: TextStyle(
                  fontSize: 10.5,
                  letterSpacing: 2,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFFEA580C),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 480,
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.10),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: InteractiveViewer(
                  constrained: false,
                  minScale: 0.3,
                  maxScale: 2.5,
                  boundaryMargin: const EdgeInsets.all(60),
                  child: SizedBox(
                    width: 800,
                    height: 1100,
                    child: RenderTemplate(id: selected!, data: data),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          Center(
            child: Text(
              'Pinch to zoom · drag to pan',
              style: TextStyle(
                fontSize: 10,
                fontStyle: FontStyle.italic,
                color: isDark
                    ? Colors.white.withValues(alpha: 0.4)
                    : const Color(0xFFA1A1AA),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Center(
            child: Text(
              'One-page format. Admin & Employer exports auto-fit to a single PDF.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 10.5,
                color: isDark
                    ? Colors.white.withValues(alpha: 0.5)
                    : const Color(0xFF71717A),
              ),
            ),
          ),
        ] else ...[
          Container(
            padding: const EdgeInsets.symmetric(vertical: 30, horizontal: 16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF18181B) : const Color(0xFFFAFAFA),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7),
              ),
            ),
            child: Center(
              child: Text(
                'Pick a template above to see your live profile preview.',
                style: TextStyle(
                  fontSize: 12,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.55)
                      : const Color(0xFF71717A),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _Swatch {
  const _Swatch({
    required this.id,
    required this.label,
    required this.desc,
    required this.style,
  });
  final String id;
  final String label;
  final String desc;
  final _Style style;
}

enum _Style { classic, modern, creative, corporate, mono }

const _swatches = [
  _Swatch(id: 'classic', label: 'Classic Executive', desc: 'Formal · serif · navy', style: _Style.classic),
  _Swatch(id: 'modern', label: 'Modern Minimal', desc: 'Clean · two-column', style: _Style.modern),
  _Swatch(id: 'creative', label: 'Creative Bold', desc: 'Gradient · color blocks', style: _Style.creative),
  _Swatch(id: 'corporate', label: 'Corporate Sidebar', desc: 'Dark sidebar · pro', style: _Style.corporate),
  _Swatch(id: 'tech_mono', label: 'Tech / Dark Mono', desc: 'Terminal · neon', style: _Style.mono),
];

class _SwatchCard extends StatelessWidget {
  const _SwatchCard({
    required this.swatch,
    required this.isSelected,
    required this.isDark,
    required this.onTap,
  });

  final _Swatch swatch;
  final bool isSelected;
  final bool isDark;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: 150,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isSelected
              ? const Color(0xFFF97316)
              : (isDark
                  ? Colors.white.withValues(alpha: 0.08)
                  : const Color(0xFFE4E4E7)),
          width: isSelected ? 2 : 1,
        ),
        boxShadow: isSelected
            ? [
                BoxShadow(
                  color: const Color(0xFFF97316).withValues(alpha: 0.30),
                  blurRadius: 14,
                  offset: const Offset(0, 6),
                ),
              ]
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(17)),
                child: SizedBox(
                  height: 110,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      _SwatchPreview(style: swatch.style),
                      if (isSelected)
                        Positioned(
                          right: 8,
                          top: 8,
                          child: Container(
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(
                                colors: [Color(0xFFF97316), Color(0xFFC2410C)],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFF97316).withValues(alpha: 0.5),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: const Icon(Icons.check_rounded, size: 15, color: Colors.white),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      swatch.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white : const Color(0xFF09090B),
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      swatch.desc,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 10,
                        height: 1.3,
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.6)
                            : const Color(0xFF71717A),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SwatchPreview extends StatelessWidget {
  const _SwatchPreview({required this.style});
  final _Style style;

  @override
  Widget build(BuildContext context) {
    switch (style) {
      case _Style.classic:
        return Container(
          color: const Color(0xFFFBF7EE),
          padding: const EdgeInsets.all(10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(width: double.infinity, height: 2, color: const Color(0xFF1E3A8A)),
              const SizedBox(height: 6),
              Container(width: 70, height: 7, decoration: BoxDecoration(color: const Color(0xFF0B1B3A), borderRadius: BorderRadius.circular(2))),
              const SizedBox(height: 4),
              Container(width: 50, height: 5, decoration: BoxDecoration(color: const Color(0xFF1E3A8A), borderRadius: BorderRadius.circular(2))),
              const SizedBox(height: 8),
              Container(width: 80, height: 1, color: const Color(0xFF1E3A8A)),
              const SizedBox(height: 4),
              ...List.generate(3, (i) => Padding(
                padding: const EdgeInsets.only(top: 3),
                child: Container(
                  width: 100 - i * 8.0,
                  height: 3,
                  decoration: BoxDecoration(color: const Color(0xFF27314D).withValues(alpha: 0.6), borderRadius: BorderRadius.circular(1)),
                ),
              )),
            ],
          ),
        );

      case _Style.modern:
        return Row(
          children: [
            Container(
              width: 48,
              color: const Color(0xFFF1F5F9),
              padding: const EdgeInsets.all(6),
              child: Column(
                children: [
                  Container(
                    width: 30,
                    height: 30,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(colors: [Color(0xFF0EA5E9), Color(0xFF0369A1)]),
                    ),
                  ),
                  const SizedBox(height: 6),
                  ...List.generate(3, (i) => Padding(
                    padding: const EdgeInsets.only(top: 3),
                    child: Container(width: 30 - i * 5.0, height: 3, decoration: BoxDecoration(color: const Color(0xFFCBD5E1), borderRadius: BorderRadius.circular(1))),
                  )),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(width: 35, height: 4, decoration: BoxDecoration(color: const Color(0xFF0284C7), borderRadius: BorderRadius.circular(1))),
                    const SizedBox(height: 5),
                    Container(width: 60, height: 6, decoration: BoxDecoration(color: const Color(0xFF18181B), borderRadius: BorderRadius.circular(1))),
                    const SizedBox(height: 6),
                    ...List.generate(3, (i) => Padding(
                      padding: const EdgeInsets.only(top: 3),
                      child: Container(width: 70 - i * 10.0, height: 3, decoration: BoxDecoration(color: const Color(0xFFE4E4E7), borderRadius: BorderRadius.circular(1))),
                    )),
                  ],
                ),
              ),
            ),
          ],
        );

      case _Style.creative:
        return Column(
          children: [
            Container(
              height: 50,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFFF97316), Color(0xFFE11D48), Color(0xFFC026D3)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              padding: const EdgeInsets.all(8),
              child: Row(
                children: [
                  Container(width: 28, height: 28, decoration: BoxDecoration(borderRadius: BorderRadius.circular(8), color: Colors.white.withValues(alpha: 0.2))),
                  const SizedBox(width: 6),
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(width: 70, height: 6, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(1))),
                      const SizedBox(height: 3),
                      Container(width: 50, height: 4, decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.7), borderRadius: BorderRadius.circular(1))),
                    ],
                  ),
                ],
              ),
            ),
            Expanded(
              child: Container(
                color: const Color(0xFFFFF8F1),
                padding: const EdgeInsets.all(8),
                width: double.infinity,
                child: Wrap(
                  spacing: 4,
                  runSpacing: 4,
                  children: List.generate(5, (i) => Container(
                    height: 11,
                    width: 22 + (i % 3) * 8.0,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [Color(0xFFFFEDD5), Color(0xFFFFE4E6)]),
                      borderRadius: BorderRadius.circular(99),
                    ),
                  )),
                ),
              ),
            ),
          ],
        );

      case _Style.corporate:
        return Row(
          children: [
            Container(
              width: 60,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(width: 28, height: 28, decoration: BoxDecoration(borderRadius: BorderRadius.circular(6), color: const Color(0xFF334155))),
                  const SizedBox(height: 6),
                  Container(width: 40, height: 5, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(1))),
                  const SizedBox(height: 3),
                  Container(width: 30, height: 3, decoration: BoxDecoration(color: const Color(0xFF34D399), borderRadius: BorderRadius.circular(1))),
                ],
              ),
            ),
            Expanded(
              child: Container(
                color: Colors.white,
                padding: const EdgeInsets.all(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(width: 30, height: 4, decoration: BoxDecoration(color: const Color(0xFF047857), borderRadius: BorderRadius.circular(1))),
                    const SizedBox(height: 5),
                    ...List.generate(4, (i) => Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Container(
                        padding: const EdgeInsets.only(left: 4),
                        decoration: const BoxDecoration(border: Border(left: BorderSide(color: Color(0xFF10B981), width: 1.5))),
                        child: Container(width: 60 - i * 7.0, height: 3, decoration: BoxDecoration(color: const Color(0xFF334155), borderRadius: BorderRadius.circular(1))),
                      ),
                    )),
                  ],
                ),
              ),
            ),
          ],
        );

      case _Style.mono:
        return Container(
          color: const Color(0xFF0A0F0D),
          padding: const EdgeInsets.all(8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(r'$ ', style: const TextStyle(color: Color(0xFF34D399), fontFamily: 'monospace', fontSize: 9, fontWeight: FontWeight.w700)),
                  Text('whoami', style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontFamily: 'monospace', fontSize: 9)),
                ],
              ),
              const SizedBox(height: 6),
              Container(width: 80, height: 6, decoration: BoxDecoration(color: const Color(0xFF34D399), borderRadius: BorderRadius.circular(1))),
              const SizedBox(height: 3),
              Container(width: 50, height: 3, decoration: BoxDecoration(color: const Color(0xFF67E8F9), borderRadius: BorderRadius.circular(1))),
              const SizedBox(height: 8),
              Wrap(
                spacing: 3,
                runSpacing: 3,
                children: List.generate(3, (i) => Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                  decoration: BoxDecoration(
                    color: const Color(0xFF34D399).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(2),
                    border: Border.all(color: const Color(0xFF34D399).withValues(alpha: 0.4), width: 0.5),
                  ),
                  child: Text(
                    ['py', 'js', 'aws'][i],
                    style: const TextStyle(color: Color(0xFF34D399), fontFamily: 'monospace', fontSize: 7),
                  ),
                )),
              ),
            ],
          ),
        );
    }
  }
}
