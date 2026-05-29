import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class EntryCards extends StatelessWidget {
  const EntryCards({
    super.key,
    required this.isDark,
    required this.onCandidate,
    required this.onEmployer,
  });

  final bool isDark;
  final VoidCallback onCandidate;
  final VoidCallback onEmployer;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
      child: Column(
        children: [
          Text(
            'CHOOSE YOUR PATH',
            style: TextStyle(
              fontSize: 11,
              letterSpacing: 2,
              fontWeight: FontWeight.w700,
              color: const Color(0xFFEA580C),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Get started in seconds',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.6,
              color: isDark ? Colors.white : const Color(0xFF09090B),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "Whether you're looking for work or talent — we built this for you.",
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              color: isDark
                  ? Colors.white.withValues(alpha: 0.6)
                  : const Color(0xFF52525B),
            ),
          ),
          const SizedBox(height: 24),
          _Card(
            isDark: isDark,
            onTap: onCandidate,
            iconAsset: 'assets/icons/candidate.svg',
            gradient: const [Color(0xFFF97316), Color(0xFFC2410C)],
            badge: 'Profile posting is FREE',
            badgeColor: const Color(0xFF10B981),
            title: 'Are you applying for a job?',
            subtitle:
                'Build your profile in minutes — no resume needed. Pick from 5 stunning templates.',
            bullets: const [
              'No CV upload — just structured details',
              'Email OTP verification',
              'Browse jobs across Tamil Nadu',
            ],
            cta: 'Start as Candidate',
          ),
          const SizedBox(height: 14),
          _Card(
            isDark: isDark,
            onTap: onEmployer,
            iconAsset: 'assets/icons/employer.svg',
            gradient: const [Color(0xFF0EA5E9), Color(0xFF0369A1)],
            badge: 'Job posting is FREE',
            badgeColor: const Color(0xFF0EA5E9),
            title: 'Are you searching for a candidate?',
            subtitle:
                'Post unlimited jobs free. Subscribe only when you want to search and reach candidates directly.',
            bullets: const [
              'Free unlimited job posts',
              'Search by skill, field, location',
              'Plans for SMEs and large enterprises',
            ],
            cta: 'Start as Employer',
          ),
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({
    required this.isDark,
    required this.onTap,
    required this.iconAsset,
    required this.gradient,
    required this.badge,
    required this.badgeColor,
    required this.title,
    required this.subtitle,
    required this.bullets,
    required this.cta,
  });

  final bool isDark;
  final VoidCallback onTap;
  final String iconAsset;
  final List<Color> gradient;
  final String badge;
  final Color badgeColor;
  final String title;
  final String subtitle;
  final List<String> bullets;
  final String cta;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            color: isDark ? const Color(0xFF18181B) : Colors.white,
            border: Border.all(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.08)
                  : const Color(0xFFE4E4E7),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.06),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Stack(
            children: [
              Positioned(
                right: -32,
                top: -32,
                child: Container(
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        gradient.first.withValues(alpha: 0.18),
                        gradient.first.withValues(alpha: 0),
                      ],
                    ),
                  ),
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      gradient: LinearGradient(
                        colors: gradient,
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: gradient.first.withValues(alpha: 0.35),
                          blurRadius: 14,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Center(
                      child: SvgPicture.asset(
                        iconAsset,
                        width: 32,
                        height: 32,
                        colorFilter: const ColorFilter.mode(Colors.white, BlendMode.srcIn),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(999),
                      color: badgeColor.withValues(alpha: isDark ? 0.18 : 0.12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: badgeColor,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          badge,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: isDark ? badgeColor.withValues(alpha: 0.9) : badgeColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.w600,
                      letterSpacing: -0.4,
                      color: isDark ? Colors.white : const Color(0xFF09090B),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.5,
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.6)
                          : const Color(0xFF52525B),
                    ),
                  ),
                  const SizedBox(height: 14),
                  ...bullets.map(
                    (b) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          const Icon(Icons.check_rounded, color: Color(0xFF10B981), size: 16),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              b,
                              style: TextStyle(
                                fontSize: 12.5,
                                color: isDark
                                    ? Colors.white.withValues(alpha: 0.7)
                                    : const Color(0xFF52525B),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Text(
                        cta,
                        style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w700,
                          color: gradient.first,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Icon(Icons.arrow_forward, size: 16, color: gradient.first),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
