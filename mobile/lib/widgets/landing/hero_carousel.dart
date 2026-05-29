import 'dart:async';
import 'package:flutter/material.dart';

class HeroSlide {
  const HeroSlide({
    required this.bg,
    required this.eyebrow,
    required this.titleStart,
    required this.titleAccent,
    required this.titleEnd,
    required this.accentColors,
    required this.description,
  });
  final String bg;
  final String eyebrow;
  final String titleStart;
  final String titleAccent;
  final String titleEnd;
  final List<Color> accentColors;
  final String description;
}

const slides = <HeroSlide>[
  HeroSlide(
    bg: 'assets/images/background-04.jpg',
    eyebrow: "Tamil Nadu's modern recruitment platform",
    titleStart: 'Where talent meets ',
    titleAccent: 'opportunity',
    titleEnd: '',
    accentColors: [Color(0xFFFB923C), Color(0xFFFCD34D)],
    description:
        'Build a beautiful candidate profile, browse jobs across Tamil Nadu, or post openings — all in one elegant place.',
  ),
  HeroSlide(
    bg: 'assets/images/background-02.jpg',
    eyebrow: 'Every field. Every district.',
    titleStart: 'Built for every ',
    titleAccent: 'Tamil Nadu professional',
    titleEnd: '',
    accentColors: [Color(0xFF6EE7B7), Color(0xFF67E8F9)],
    description:
        'IT, HR, Sales, Finance, BPO, voice process, supply chain, vocational trades — every field belongs here. We don\'t favor one.',
  ),
  HeroSlide(
    bg: 'assets/images/background-03.jpg',
    eyebrow: 'Freshers and seasoned pros',
    titleStart: 'From your ',
    titleAccent: 'first internship',
    titleEnd: ' to your next chapter',
    accentColors: [Color(0xFFFDA4AF), Color(0xFFFCA5A5)],
    description:
        'College students chasing their first opportunity, or experienced professionals chasing the next role — stand out and get found.',
  ),
  HeroSlide(
    bg: 'assets/images/background-01.png',
    eyebrow: 'Free to start. Simple to scale.',
    titleStart: 'Post free. ',
    titleAccent: 'Subscribe only when ready.',
    titleEnd: '',
    accentColors: [Color(0xFFC4B5FD), Color(0xFFF0ABFC)],
    description:
        'Candidates post profiles free. Employers post jobs free. A flexible subscription unlocks applying and candidate search.',
  ),
];

class HeroCarousel extends StatefulWidget {
  const HeroCarousel({super.key, this.onPrimary});
  final VoidCallback? onPrimary;

  @override
  State<HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends State<HeroCarousel> {
  final _controller = PageController();
  Timer? _timer;
  int _idx = 0;

  @override
  void initState() {
    super.initState();
    _startAuto();
  }

  void _startAuto() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 6), (_) {
      if (!mounted) return;
      final next = (_idx + 1) % slides.length;
      _controller.animateToPage(
        next,
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 580,
      child: Stack(
        fit: StackFit.expand,
        children: [
          PageView.builder(
            controller: _controller,
            onPageChanged: (i) => setState(() => _idx = i),
            itemCount: slides.length,
            itemBuilder: (_, i) => _SlideContent(slide: slides[i], onPrimary: widget.onPrimary),
          ),
          Positioned(
            bottom: 24,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(slides.length, (i) {
                final active = i == _idx;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  height: 6,
                  width: active ? 28 : 8,
                  decoration: BoxDecoration(
                    color: active ? Colors.white : Colors.white.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(999),
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}

class _SlideContent extends StatelessWidget {
  const _SlideContent({required this.slide, this.onPrimary});
  final HeroSlide slide;
  final VoidCallback? onPrimary;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Image.asset(slide.bg, fit: BoxFit.cover, alignment: Alignment.center),
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.black.withValues(alpha: 0.45),
                Colors.black.withValues(alpha: 0.65),
                Colors.black.withValues(alpha: 0.85),
              ],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
        ),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 80, 24, 60),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                          color: Color(0xFF34D399),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        slide.eyebrow,
                        style: const TextStyle(
                          fontSize: 11,
                          color: Colors.white,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                RichText(
                  textAlign: TextAlign.center,
                  text: TextSpan(
                    style: const TextStyle(
                      fontSize: 32,
                      height: 1.15,
                      fontWeight: FontWeight.w600,
                      letterSpacing: -0.8,
                      color: Colors.white,
                    ),
                    children: [
                      TextSpan(text: slide.titleStart),
                      TextSpan(
                        text: slide.titleAccent,
                        style: TextStyle(
                          foreground: Paint()
                            ..shader = LinearGradient(
                              colors: slide.accentColors,
                            ).createShader(const Rect.fromLTWH(0, 0, 400, 60)),
                        ),
                      ),
                      TextSpan(text: slide.titleEnd),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  slide.description,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    height: 1.55,
                    color: Colors.white.withValues(alpha: 0.85),
                  ),
                ),
                const SizedBox(height: 28),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ElevatedButton(
                      onPressed: onPrimary,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: const Color(0xFF09090B),
                        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(999),
                        ),
                        elevation: 6,
                        shadowColor: Colors.black.withValues(alpha: 0.3),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('Get Started', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                          SizedBox(width: 6),
                          Icon(Icons.arrow_forward, size: 16),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
