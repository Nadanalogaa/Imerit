import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

enum MarkerTone { brand, sky, emerald, anchor }

class MapListItem {
  const MapListItem({
    required this.id,
    required this.listBuilder,
    this.lat,
    this.lng,
    this.popupBuilder,
  });
  final String id;
  final double? lat;
  final double? lng;
  /// Card to render inside the list section.
  final WidgetBuilder listBuilder;
  /// Optional popup card shown when the marker is tapped.
  final WidgetBuilder? popupBuilder;
}

class MapAnchor {
  const MapAnchor({required this.lat, required this.lng, this.label});
  final double lat;
  final double lng;
  final String? label;
}

enum MapListMode { list, map, split }

/// Mobile twin of web's `<MapListLayout/>` — OpenStreetMap tiles, custom
/// pin markers, list + map toggle with hover/tap-sync.
class MapListView extends StatefulWidget {
  const MapListView({
    super.key,
    required this.items,
    required this.isDark,
    this.anchor,
    this.radiusKm,
    this.markerTone = MarkerTone.brand,
    this.defaultCenter = const LatLng(11.1271, 78.6569), // TN center
    this.defaultZoom = 7,
    this.emptyState,
    this.initialMode = MapListMode.list,
  });

  final List<MapListItem> items;
  final MapAnchor? anchor;
  final double? radiusKm;
  final MarkerTone markerTone;
  final LatLng defaultCenter;
  final double defaultZoom;
  final Widget? emptyState;
  final bool isDark;
  final MapListMode initialMode;

  @override
  State<MapListView> createState() => _MapListViewState();
}

class _MapListViewState extends State<MapListView> {
  late MapListMode _mode = widget.initialMode;
  String? _active;
  final MapController _mapCtrl = MapController();

  @override
  void didUpdateWidget(covariant MapListView oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Re-fit when items change while map is visible.
    if (_mode != MapListMode.list && widget.items != oldWidget.items) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _fitToBounds());
    }
  }

  void _fitToBounds() {
    final pts = <LatLng>[
      ...widget.items.where((it) => it.lat != null && it.lng != null).map((it) => LatLng(it.lat!, it.lng!)),
      if (widget.anchor != null) LatLng(widget.anchor!.lat, widget.anchor!.lng),
    ];
    if (pts.isEmpty) return;
    if (pts.length == 1) {
      _mapCtrl.move(pts.first, 11);
      return;
    }
    _mapCtrl.fitCamera(
      CameraFit.bounds(
        bounds: LatLngBounds.fromPoints(pts),
        padding: const EdgeInsets.all(48),
        maxZoom: 12,
      ),
    );
  }

  void _focusOn(MapListItem item) {
    if (item.lat == null || item.lng == null) return;
    setState(() => _active = item.id);
    _mapCtrl.move(LatLng(item.lat!, item.lng!), 13);
  }

  Color _toneColor() {
    switch (widget.markerTone) {
      case MarkerTone.brand: return const Color(0xFFF97316);
      case MarkerTone.sky: return const Color(0xFF0EA5E9);
      case MarkerTone.emerald: return const Color(0xFF10B981);
      case MarkerTone.anchor: return const Color(0xFF6366F1);
    }
  }

  @override
  Widget build(BuildContext context) {
    final withCoords = widget.items.where((it) => it.lat != null && it.lng != null).toList();
    final hasItems = widget.items.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Toggle row
        Row(
          children: [
            Expanded(
              child: Text(
                hasItems ? '${widget.items.length} result${widget.items.length == 1 ? "" : "s"}' : '',
                style: TextStyle(
                  fontSize: 11,
                  color: widget.isDark ? Colors.white.withValues(alpha: 0.5) : const Color(0xFF71717A),
                ),
              ),
            ),
            _ToggleBar(
              isDark: widget.isDark,
              value: _mode,
              onChange: (m) {
                setState(() => _mode = m);
                if (m != MapListMode.list) {
                  WidgetsBinding.instance.addPostFrameCallback((_) => _fitToBounds());
                }
              },
            ),
          ],
        ),
        const SizedBox(height: 10),

        // Body
        if (_mode == MapListMode.list) ..._buildList(),
        if (_mode == MapListMode.map) _buildMap(withCoords, height: 480),
        if (_mode == MapListMode.split) ...[
          _buildMap(withCoords, height: 280),
          const SizedBox(height: 14),
          ..._buildList(),
        ],
      ],
    );
  }

  List<Widget> _buildList() {
    if (widget.items.isEmpty) {
      return [widget.emptyState ?? _defaultEmpty()];
    }
    return List.generate(widget.items.length, (i) {
      final it = widget.items[i];
      final isActive = _active == it.id;
      return Padding(
        padding: EdgeInsets.only(bottom: i == widget.items.length - 1 ? 0 : 12),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            border: isActive
                ? Border.all(color: _toneColor(), width: 2)
                : null,
          ),
          child: GestureDetector(
            onTapDown: (_) => setState(() => _active = it.id),
            child: it.listBuilder(context),
          ),
        ),
      );
    });
  }

  Widget _buildMap(List<MapListItem> withCoords, {required double height}) {
    final initialCenter = widget.anchor != null
        ? LatLng(widget.anchor!.lat, widget.anchor!.lng)
        : withCoords.isNotEmpty
            ? LatLng(withCoords.first.lat!, withCoords.first.lng!)
            : widget.defaultCenter;

    return Container(
      height: height,
      clipBehavior: Clip.hardEdge,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: widget.isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7),
        ),
      ),
      child: Stack(
        children: [
          FlutterMap(
            mapController: _mapCtrl,
            options: MapOptions(
              initialCenter: initialCenter,
              initialZoom: widget.defaultZoom,
              minZoom: 4,
              maxZoom: 18,
              onMapReady: _fitToBounds,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                subdomains: const ['a', 'b', 'c'],
                userAgentPackageName: 'com.itamilrecruit.app',
                // Soft "dark mode" via simple opacity overlay below
              ),
              if (widget.isDark)
                // Cheap dark filter
                Opacity(
                  opacity: 1,
                  child: ColorFiltered(
                    colorFilter: const ColorFilter.matrix(<double>[
                      -0.6, -0.05, -0.05, 0, 200,
                      -0.05, -0.6, -0.05, 0, 200,
                      -0.05, -0.05, -0.6, 0, 200,
                       0,     0,    0,    1, 0,
                    ]),
                    child: Container(),
                  ),
                ),
              if (widget.anchor != null && widget.radiusKm != null && widget.radiusKm! > 0 && widget.radiusKm! < 5000)
                CircleLayer(
                  circles: [
                    CircleMarker(
                      point: LatLng(widget.anchor!.lat, widget.anchor!.lng),
                      radius: widget.radiusKm! * 1000,
                      useRadiusInMeter: true,
                      color: const Color(0xFF6366F1).withValues(alpha: 0.10),
                      borderColor: const Color(0xFF6366F1),
                      borderStrokeWidth: 1.5,
                    ),
                  ],
                ),
              MarkerLayer(
                markers: [
                  if (widget.anchor != null)
                    Marker(
                      point: LatLng(widget.anchor!.lat, widget.anchor!.lng),
                      width: 36, height: 44,
                      child: _Pin(tone: MarkerTone.anchor, active: false),
                    ),
                  ...withCoords.map((it) => Marker(
                        point: LatLng(it.lat!, it.lng!),
                        width: 36, height: 44,
                        child: GestureDetector(
                          onTap: () {
                            _focusOn(it);
                            if (it.popupBuilder != null) {
                              showModalBottomSheet<void>(
                                context: context,
                                backgroundColor: widget.isDark ? const Color(0xFF18181B) : Colors.white,
                                shape: const RoundedRectangleBorder(
                                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                                ),
                                builder: (ctx) => Padding(
                                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    crossAxisAlignment: CrossAxisAlignment.stretch,
                                    children: [
                                      Center(
                                        child: Container(
                                          width: 40, height: 4,
                                          margin: const EdgeInsets.only(bottom: 12),
                                          decoration: BoxDecoration(
                                            color: widget.isDark ? Colors.white24 : const Color(0xFFE4E4E7),
                                            borderRadius: BorderRadius.circular(2),
                                          ),
                                        ),
                                      ),
                                      it.popupBuilder!(ctx),
                                    ],
                                  ),
                                ),
                              );
                            }
                          },
                          child: _Pin(tone: widget.markerTone, active: _active == it.id),
                        ),
                      )),
                ],
              ),
            ],
          ),
          // OSM attribution (legal req)
          Positioned(
            right: 6, bottom: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: (widget.isDark ? Colors.black : Colors.white).withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                '© OpenStreetMap',
                style: TextStyle(
                  fontSize: 9,
                  color: widget.isDark ? Colors.white70 : Colors.black54,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _defaultEmpty() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: widget.isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7),
        ),
      ),
      child: Center(
        child: Column(
          children: [
            Icon(Icons.search_off_rounded, size: 32, color: widget.isDark ? Colors.white38 : const Color(0xFFA1A1AA)),
            const SizedBox(height: 8),
            Text(
              'No results',
              style: TextStyle(
                fontSize: 13, fontWeight: FontWeight.w700,
                color: widget.isDark ? Colors.white : const Color(0xFF09090B),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ToggleBar extends StatelessWidget {
  const _ToggleBar({required this.value, required this.onChange, required this.isDark});
  final MapListMode value;
  final ValueChanged<MapListMode> onChange;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _seg(MapListMode.list, Icons.list_rounded),
          _seg(MapListMode.split, Icons.dashboard_rounded),
          _seg(MapListMode.map, Icons.map_rounded),
        ],
      ),
    );
  }

  Widget _seg(MapListMode m, IconData icon) {
    final selected = m == value;
    return GestureDetector(
      onTap: () => onChange(m),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? (isDark ? Colors.white : const Color(0xFF09090B)) : Colors.transparent,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Icon(
          icon,
          size: 14,
          color: selected
              ? (isDark ? Colors.black : Colors.white)
              : (isDark ? Colors.white60 : const Color(0xFF71717A)),
        ),
      ),
    );
  }
}

class _Pin extends StatelessWidget {
  const _Pin({required this.tone, required this.active});
  final MarkerTone tone;
  final bool active;

  List<Color> _colors() {
    switch (tone) {
      case MarkerTone.brand: return const [Color(0xFFF97316), Color(0xFFC2410C)];
      case MarkerTone.sky: return const [Color(0xFF0EA5E9), Color(0xFF0369A1)];
      case MarkerTone.emerald: return const [Color(0xFF10B981), Color(0xFF047857)];
      case MarkerTone.anchor: return const [Color(0xFF6366F1), Color(0xFF4338CA)];
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = _colors();
    final pinSize = active ? 34.0 : 28.0;
    return SizedBox(
      width: 36, height: 44,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Drop shadow
          Positioned(
            bottom: 2,
            child: Container(
              width: 14, height: 4,
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(99),
              ),
            ),
          ),
          Positioned(
            top: 0,
            child: Transform.rotate(
              angle: -0.7853981633974483, // -45deg
              child: Container(
                width: pinSize, height: pinSize,
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: colors, begin: Alignment.topLeft, end: Alignment.bottomRight),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(99),
                    topRight: Radius.circular(99),
                    bottomLeft: Radius.circular(99),
                  ),
                  border: Border.all(color: active ? const Color(0xFFFACC15) : Colors.white, width: 3),
                  boxShadow: [
                    BoxShadow(color: colors.first.withValues(alpha: 0.45), blurRadius: 8, offset: const Offset(0, 4)),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
