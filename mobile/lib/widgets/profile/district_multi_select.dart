import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../store/locations_provider.dart';
import '../../store/theme_provider.dart';

/// Multi-select picker for preferred work districts. Replaces the
/// single-district PlaceRef picker on the candidate profile form and mirrors
/// the web `DistrictMultiSelect` component so candidates can express
/// "willing to work in Chennai, Salem, OR Coimbatore" without having to
/// nail a specific taluk / pincode for each.
///
/// Interaction: tap a chip to toggle. Tap the plus tile to open a modal
/// bottom sheet with a search box + full district list — mobile-native,
/// keyboard-friendly, and cheaper than a giant Wrap of 38 chips inline.
class DistrictMultiSelect extends ConsumerWidget {
  const DistrictMultiSelect({
    super.key,
    required this.value,
    required this.onChange,
    this.max = 5,
  });

  final List<String> value;
  final ValueChanged<List<String>> onChange;

  /// Soft cap on selections — helps the matcher stay meaningful (a
  /// candidate who says "I'll work anywhere" essentially opts out of
  /// distance scoring). 5 matches the web wizard's default cap.
  final int max;

  void _toggle(String id) {
    if (value.contains(id)) {
      onChange(value.where((v) => v != id).toList());
    } else {
      if (value.length >= max) return;
      onChange([...value, id]);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final data = ref.watch(locationsProvider);
    final selected = value
        .map((id) => data.districtById(id))
        .whereType<District>()
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: [
            ...selected.map((d) => _SelectedChip(
                  label: d.name,
                  onRemove: () => _toggle(d.id),
                  isDark: isDark,
                )),
            _AddTile(
              disabled: value.length >= max,
              isDark: isDark,
              onTap: () async {
                HapticFeedback.selectionClick();
                final picked = await showModalBottomSheet<List<String>>(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: Colors.transparent,
                  builder: (_) => _DistrictPickerSheet(
                    initial: value,
                    max: max,
                    data: data,
                    isDark: isDark,
                  ),
                );
                if (picked != null) onChange(picked);
              },
            ),
          ],
        ),
        if (value.isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(
            '${value.length}/$max districts selected',
            style: TextStyle(
              fontSize: 10.5,
              color: isDark
                  ? Colors.white.withValues(alpha: 0.45)
                  : const Color(0xFF71717A),
            ),
          ),
        ],
      ],
    );
  }
}

class _SelectedChip extends StatelessWidget {
  const _SelectedChip({
    required this.label,
    required this.onRemove,
    required this.isDark,
  });
  final String label;
  final VoidCallback onRemove;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFFF97316), Color(0xFFEA580C)]),
        borderRadius: BorderRadius.circular(999),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFF97316).withValues(alpha: 0.35),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.location_on_rounded, size: 12, color: Colors.white),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: Colors.white)),
          const SizedBox(width: 6),
          InkWell(
            onTap: onRemove,
            borderRadius: BorderRadius.circular(999),
            child: const Icon(Icons.close_rounded, size: 12, color: Colors.white),
          ),
        ],
      ),
    );
  }
}

class _AddTile extends StatelessWidget {
  const _AddTile({required this.onTap, required this.disabled, required this.isDark});
  final VoidCallback onTap;
  final bool disabled;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: disabled ? null : onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: disabled
                  ? (isDark ? Colors.white.withValues(alpha: 0.10) : const Color(0xFFE4E4E7))
                  : const Color(0xFFF97316).withValues(alpha: 0.5),
              style: BorderStyle.solid,
              width: 1.5,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.add_rounded,
                size: 14,
                color: disabled
                    ? (isDark ? Colors.white.withValues(alpha: 0.35) : const Color(0xFFA1A1AA))
                    : const Color(0xFFF97316),
              ),
              const SizedBox(width: 4),
              Text(
                disabled ? 'Max reached' : 'Add district',
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: disabled
                      ? (isDark ? Colors.white.withValues(alpha: 0.35) : const Color(0xFFA1A1AA))
                      : const Color(0xFFF97316),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DistrictPickerSheet extends StatefulWidget {
  const _DistrictPickerSheet({
    required this.initial,
    required this.max,
    required this.data,
    required this.isDark,
  });
  final List<String> initial;
  final int max;
  final LocationsData data;
  final bool isDark;

  @override
  State<_DistrictPickerSheet> createState() => _DistrictPickerSheetState();
}

class _DistrictPickerSheetState extends State<_DistrictPickerSheet> {
  late List<String> _selected;
  final _search = TextEditingController();

  @override
  void initState() {
    super.initState();
    _selected = [...widget.initial];
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    final q = _search.text.trim().toLowerCase();
    final filtered = widget.data.districts.where((d) {
      if (q.isEmpty) return true;
      if (d.name.toLowerCase().contains(q)) return true;
      if (d.nameTa.toLowerCase().contains(q)) return true;
      return d.synonyms.any((s) => s.toLowerCase().contains(q));
    }).toList();

    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) => Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF18181B) : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.only(top: 8),
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.15) : const Color(0xFFE4E4E7),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Preferred districts',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : const Color(0xFF09090B),
                          ),
                        ),
                        Text(
                          'Pick where you\'d work — up to ${widget.max}',
                          style: TextStyle(
                            fontSize: 11.5,
                            color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF71717A),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF97316).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      '${_selected.length}/${widget.max}',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFFC2410C)),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
              child: TextField(
                controller: _search,
                onChanged: (_) => setState(() {}),
                style: TextStyle(fontSize: 13, color: isDark ? Colors.white : const Color(0xFF09090B)),
                decoration: InputDecoration(
                  hintText: 'Search districts...',
                  hintStyle: TextStyle(fontSize: 12.5, color: isDark ? Colors.white.withValues(alpha: 0.3) : const Color(0xFFA1A1AA)),
                  prefixIcon: Icon(Icons.search_rounded, size: 18, color: isDark ? Colors.white.withValues(alpha: 0.5) : const Color(0xFFA1A1AA)),
                  isDense: true,
                  filled: true,
                  fillColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.10) : const Color(0xFFE4E4E7)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.10) : const Color(0xFFE4E4E7)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: Color(0xFFF97316), width: 1.5),
                  ),
                ),
              ),
            ),
            Expanded(
              child: ListView.builder(
                controller: scrollController,
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                itemCount: filtered.length,
                itemBuilder: (_, i) {
                  final d = filtered[i];
                  final selected = _selected.contains(d.id);
                  final atMax = _selected.length >= widget.max && !selected;
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: atMax
                            ? null
                            : () {
                                HapticFeedback.selectionClick();
                                setState(() {
                                  if (selected) {
                                    _selected.remove(d.id);
                                  } else {
                                    _selected.add(d.id);
                                  }
                                });
                              },
                        borderRadius: BorderRadius.circular(12),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: selected
                                ? const Color(0xFFF97316).withValues(alpha: 0.12)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: selected
                                  ? const Color(0xFFF97316)
                                  : (isDark ? Colors.white.withValues(alpha: 0.06) : const Color(0xFFF4F4F5)),
                              width: selected ? 1.5 : 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                selected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                                size: 18,
                                color: selected
                                    ? const Color(0xFFF97316)
                                    : (atMax
                                        ? (isDark ? Colors.white.withValues(alpha: 0.15) : const Color(0xFFD4D4D8))
                                        : (isDark ? Colors.white.withValues(alpha: 0.5) : const Color(0xFF71717A))),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Row(
                                  children: [
                                    Text(
                                      d.name,
                                      style: TextStyle(
                                        fontSize: 13.5,
                                        fontWeight: FontWeight.w700,
                                        color: atMax && !selected
                                            ? (isDark ? Colors.white.withValues(alpha: 0.35) : const Color(0xFFA1A1AA))
                                            : (isDark ? Colors.white : const Color(0xFF09090B)),
                                      ),
                                    ),
                                    if (d.nameTa.isNotEmpty) ...[
                                      const SizedBox(width: 6),
                                      Text(
                                        d.nameTa,
                                        style: TextStyle(
                                          fontSize: 11.5,
                                          color: isDark ? Colors.white.withValues(alpha: 0.45) : const Color(0xFF71717A),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              Text(
                                '${d.taluks.length} taluks',
                                style: TextStyle(
                                  fontSize: 10.5,
                                  color: isDark ? Colors.white.withValues(alpha: 0.4) : const Color(0xFFA1A1AA),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            Container(
              padding: EdgeInsets.fromLTRB(20, 12, 20, 12 + MediaQuery.of(context).padding.bottom),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF18181B) : Colors.white,
                border: Border(
                  top: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.06) : const Color(0xFFE4E4E7)),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        foregroundColor: isDark ? Colors.white.withValues(alpha: 0.7) : const Color(0xFF52525B),
                      ),
                      child: const Text('Cancel', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: () {
                        HapticFeedback.mediumImpact();
                        Navigator.of(context).pop(_selected);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFF97316),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 6,
                        shadowColor: const Color(0xFFF97316).withValues(alpha: 0.4),
                      ),
                      child: Text(
                        _selected.isEmpty ? 'Save (no preference)' : 'Save ${_selected.length} district${_selected.length == 1 ? "" : "s"}',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
