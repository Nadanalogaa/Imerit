import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../store/locations_provider.dart';
import '../store/theme_provider.dart';

class LocationPickerWidget extends ConsumerStatefulWidget {
  const LocationPickerWidget({
    super.key,
    required this.value,
    required this.onChange,
    this.allowStreet = true,
    this.allowPincode = true,
  });

  final PlaceRef value;
  final ValueChanged<PlaceRef> onChange;
  final bool allowStreet;
  final bool allowPincode;

  @override
  ConsumerState<LocationPickerWidget> createState() => _LocationPickerWidgetState();
}

class _LocationPickerWidgetState extends ConsumerState<LocationPickerWidget> {
  late final TextEditingController _pincode;
  late final TextEditingController _street;

  @override
  void initState() {
    super.initState();
    _pincode = TextEditingController(text: widget.value.pincode ?? '');
    _street = TextEditingController(text: widget.value.street ?? '');
  }

  @override
  void dispose() {
    _pincode.dispose();
    _street.dispose();
    super.dispose();
  }

  void _applyPincode(String code) {
    if (code.length != 6) {
      widget.onChange(widget.value.copyWith(pincode: code));
      return;
    }
    final loc = ref.read(locationsProvider);
    final r = loc.resolvePincode(code);
    if (r != null) {
      // If the wider dataset only knew the district we clear any stale taluk
      // so the dropdown reads as needing input.
      widget.onChange(PlaceRef(
        districtId: r.district.id,
        talukId: r.taluk?.id,
        lat: r.lat,
        lng: r.lng,
        pincode: code,
        street: widget.value.street,
      ));
    } else {
      widget.onChange(widget.value.copyWith(pincode: code));
    }
  }

  void _setDistrict(String? districtId) {
    if (districtId == null) return;
    final loc = ref.read(locationsProvider);
    final d = loc.districtById(districtId);
    if (d == null) return;
    widget.onChange(PlaceRef(
      districtId: districtId,
      talukId: null,
      lat: d.lat,
      lng: d.lng,
      pincode: widget.value.pincode,
      street: widget.value.street,
    ));
  }

  void _setTaluk(String? talukId) {
    if (talukId == null) return;
    final loc = ref.read(locationsProvider);
    final found = loc.talukById(talukId);
    if (found == null) return;
    widget.onChange(PlaceRef(
      districtId: found.district.id,
      talukId: talukId,
      lat: found.taluk.lat,
      lng: found.taluk.lng,
      pincode: widget.value.pincode,
      street: widget.value.street,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final loc = ref.watch(locationsProvider);
    final districts = loc.districts;
    final taluks = widget.value.districtId != null
        ? loc.taluksOf(widget.value.districtId!)
        : <Taluk>[];

    final currentDistrict = widget.value.districtId != null
        ? loc.districtById(widget.value.districtId!)
        : null;
    final currentTaluk = widget.value.talukId != null
        ? loc.talukById(widget.value.talukId!)?.taluk
        : null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.allowPincode) ...[
          _label('Pincode (auto-fills district + taluk)', isDark),
          const SizedBox(height: 6),
          TextField(
            controller: _pincode,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
            onChanged: _applyPincode,
            style: TextStyle(fontSize: 14, color: isDark ? Colors.white : const Color(0xFF09090B)),
            decoration: _inputDeco(isDark, hint: 'e.g. 600001', icon: Icons.search_rounded),
          ),
          if (_pincode.text.length == 6) ...[
            const SizedBox(height: 6),
            Builder(builder: (ctx) {
              final r = loc.resolvePincode(_pincode.text);
              if (r == null) {
                return const Row(
                  children: [
                    Icon(Icons.error_outline_rounded, size: 12, color: Color(0xFFB45309)),
                    SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        'Pincode not in our directory. Pick district + taluk manually below.',
                        style: TextStyle(fontSize: 11, color: Color(0xFFB45309), fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                );
              }
              return Row(
                children: [
                  const Icon(Icons.check_circle_rounded, size: 12, color: Color(0xFF059669)),
                  const SizedBox(width: 4),
                  Expanded(
                    child: RichText(
                      text: TextSpan(
                        style: const TextStyle(fontSize: 11, color: Color(0xFF059669)),
                        children: [
                          TextSpan(text: r.district.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                          if (r.office != null && r.office!.isNotEmpty) TextSpan(text: ' · ${r.office}'),
                          if (r.taluk == null)
                            const TextSpan(
                              text: ' — pick your taluk below',
                              style: TextStyle(color: Color(0xFFB45309), fontWeight: FontWeight.w600),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            }),
          ],
          const SizedBox(height: 12),
        ],
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _label('District', isDark),
                  const SizedBox(height: 6),
                  _dropdown<String>(
                    isDark: isDark,
                    value: widget.value.districtId,
                    hint: 'Select district',
                    items: districts.map((d) => DropdownMenuItem(value: d.id, child: Text(d.name, overflow: TextOverflow.ellipsis))).toList(),
                    onChanged: _setDistrict,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _label('Taluk', isDark),
                  const SizedBox(height: 6),
                  _dropdown<String>(
                    isDark: isDark,
                    value: widget.value.talukId,
                    hint: widget.value.districtId == null ? 'Pick district first' : 'Select taluk (${taluks.length})',
                    enabled: widget.value.districtId != null,
                    items: taluks.map((t) => DropdownMenuItem(value: t.id, child: Text(t.name, overflow: TextOverflow.ellipsis))).toList(),
                    onChanged: _setTaluk,
                  ),
                ],
              ),
            ),
          ],
        ),
        if (widget.allowStreet) ...[
          const SizedBox(height: 12),
          _label('Street / landmark (optional · private)', isDark),
          const SizedBox(height: 6),
          TextField(
            controller: _street,
            onChanged: (v) => widget.onChange(widget.value.copyWith(street: v)),
            style: TextStyle(fontSize: 14, color: isDark ? Colors.white : const Color(0xFF09090B)),
            decoration: _inputDeco(isDark, hint: 'e.g. Near Egmore Museum'),
          ),
          const SizedBox(height: 4),
          Text(
            'Public cards only show District + Taluk. Street is private.',
            style: TextStyle(fontSize: 10.5, color: isDark ? Colors.white.withValues(alpha: 0.5) : const Color(0xFF71717A)),
          ),
        ],
        if (currentDistrict != null && currentTaluk != null) ...[
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.place_rounded, size: 14, color: Color(0xFF059669)),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    '${currentTaluk.name}, ${currentDistrict.name} · ${currentTaluk.lat.toStringAsFixed(3)}, ${currentTaluk.lng.toStringAsFixed(3)}',
                    style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: Color(0xFF059669)),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _label(String text, bool isDark) => Text(
        text,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: isDark ? Colors.white.withValues(alpha: 0.8) : const Color(0xFF3F3F46),
        ),
      );

  InputDecoration _inputDeco(bool isDark, {String? hint, IconData? icon}) => InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(fontSize: 13, color: isDark ? Colors.white.withValues(alpha: 0.3) : const Color(0xFFA1A1AA)),
        prefixIcon: icon != null ? Icon(icon, size: 16, color: isDark ? Colors.white.withValues(alpha: 0.5) : const Color(0xFFA1A1AA)) : null,
        isDense: true,
        filled: true,
        fillColor: isDark ? const Color(0xFF09090B) : Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.10) : const Color(0xFFE4E4E7))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.10) : const Color(0xFFE4E4E7))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFF97316), width: 1.5)),
      );

  Widget _dropdown<T>({
    required bool isDark,
    required T? value,
    required String hint,
    required List<DropdownMenuItem<T>> items,
    required ValueChanged<T?> onChanged,
    bool enabled = true,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF09090B) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.10) : const Color(0xFFE4E4E7)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          isExpanded: true,
          isDense: true,
          hint: Text(hint, style: TextStyle(fontSize: 13, color: isDark ? Colors.white.withValues(alpha: 0.4) : const Color(0xFFA1A1AA))),
          icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 18),
          style: TextStyle(fontSize: 13, color: isDark ? Colors.white : const Color(0xFF09090B)),
          dropdownColor: isDark ? const Color(0xFF18181B) : Colors.white,
          items: items,
          onChanged: enabled ? onChanged : null,
        ),
      ),
    );
  }
}
