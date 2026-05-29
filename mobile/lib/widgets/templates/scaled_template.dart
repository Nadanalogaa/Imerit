import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

/// Lays out [child] at a fixed [designWidth] (with whatever height it
/// naturally needs) and visually scales it down to fit the parent's
/// available width. Tolerates children that don't support intrinsics
/// (e.g. Wrap), unlike FittedBox.
class ScaledTemplate extends StatelessWidget {
  const ScaledTemplate({
    super.key,
    required this.child,
    this.designWidth = 800,
  });

  final Widget child;
  final double designWidth;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (ctx, constraints) {
        final scale = constraints.hasBoundedWidth
            ? (constraints.maxWidth / designWidth).clamp(0.0, 1.0)
            : 1.0;
        return ClipRect(
          child: _Scaled(
            scale: scale,
            designWidth: designWidth,
            child: child,
          ),
        );
      },
    );
  }
}

class _Scaled extends SingleChildRenderObjectWidget {
  const _Scaled({
    required this.scale,
    required this.designWidth,
    required Widget super.child,
  });

  final double scale;
  final double designWidth;

  @override
  RenderObject createRenderObject(BuildContext context) {
    return _RenderScaled(scale: scale, designWidth: designWidth);
  }

  @override
  void updateRenderObject(BuildContext context, _RenderScaled renderObject) {
    renderObject
      ..scale = scale
      ..designWidth = designWidth;
  }
}

class _RenderScaled extends RenderBox
    with RenderObjectWithChildMixin<RenderBox> {
  _RenderScaled({required double scale, required double designWidth})
      : _scale = scale,
        _designWidth = designWidth;

  double _scale;
  double _designWidth;

  set scale(double v) {
    if (_scale != v) {
      _scale = v;
      markNeedsLayout();
    }
  }

  set designWidth(double v) {
    if (_designWidth != v) {
      _designWidth = v;
      markNeedsLayout();
    }
  }

  @override
  void performLayout() {
    final c = child;
    if (c == null) {
      size = Size.zero;
      return;
    }
    // Lay out child at fixed design width, free to grow vertically.
    c.layout(BoxConstraints.tightFor(width: _designWidth), parentUsesSize: true);
    final cs = c.size;
    size = constraints.constrain(Size(cs.width * _scale, cs.height * _scale));
  }

  @override
  void paint(PaintingContext context, Offset offset) {
    final c = child;
    if (c == null) return;
    if (_scale == 1.0) {
      context.paintChild(c, offset);
      return;
    }
    final transform = Matrix4.identity()..scaleByDouble(_scale, _scale, 1.0, 1.0);
    layer = context.pushTransform(
      needsCompositing,
      offset,
      transform,
      (ctx, off) => ctx.paintChild(c, off),
      oldLayer: layer as TransformLayer?,
    );
  }

  @override
  bool hitTestChildren(BoxHitTestResult result, {required Offset position}) {
    final c = child;
    if (c == null) return false;
    return result.addWithPaintTransform(
      transform: Matrix4.identity()..scaleByDouble(_scale, _scale, 1.0, 1.0),
      position: position,
      hitTest: (BoxHitTestResult r, Offset p) => c.hitTest(r, position: p),
    );
  }
}
