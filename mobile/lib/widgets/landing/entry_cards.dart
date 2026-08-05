import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class EntryCards extends StatelessWidget {
  const EntryCards({
    super.key,
    required this.isDark,
    required this.onCandidate,
    required this.onEmployer,
    this.onCandidateSignIn,
    this.onEmployerSignIn,
  });

  final bool isDark;
  final VoidCallback onCandidate;
  final VoidCallback onEmployer;
  final VoidCallback? onCandidateSignIn;
  final VoidCallback? onEmployerSignIn;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
      child: Column(
        children: [
          const Text(
            'CHOOSE YOUR PATH',
            style: TextStyle(
              fontSize: 11,
              letterSpacing: 2,
              fontWeight: FontWeight.w700,
              color: Color(0xFFEA580C),
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
            onStart: onCandidate,
            onSignIn: onCandidateSignIn,
            iconAsset: 'assets/icons/candidate.svg',
            gradient: const [Color(0xFFF97316), Color(0xFFC2410C)],
            title: "I'm a Candidate",
            subtitle:
                'Update your profile, highlight your skills, and discover job opportunities.',
            features: const [
              'Profile Posting is Free',
              'Explore Jobs Near Your Hometown Today',
            ],
            cta: 'Start as Candidate',
          ),
          const SizedBox(height: 14),
          _Card(
            isDark: isDark,
            onStart: onEmployer,
            onSignIn: onEmployerSignIn,
            iconAsset: 'assets/icons/employer.svg',
            gradient: const [Color(0xFF0EA5E9), Color(0xFF0369A1)],
            title: "I'm an Employer",
            subtitle:
                'Job posting is absolutely free — unlimited vacancies. No time limit.',
            features: const [
              'Browse District-Wise Candidates',
              'A Simple Subscription to Find the Right Talent',
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
    required this.onStart,
    required this.iconAsset,
    required this.gradient,
    required this.title,
    required this.subtitle,
    required this.features,
    required this.cta,
    this.onSignIn,
  });

  final bool isDark;
  final VoidCallback onStart;
  final VoidCallback? onSignIn;
  final String iconAsset;
  final List<Color> gradient;
  final String title;
  final String subtitle;
  final List<String> features;
  final String cta;

  @override
  Widget build(BuildContext context) {
    return Container(
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
              Text(
                title,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.5,
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
                      ? Colors.white.withValues(alpha: 0.65)
                      : const Color(0xFF52525B),
                ),
              ),
              const SizedBox(height: 14),
              ...features.map(
                (f) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 5),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(top: 6, right: 10),
                        child: Container(
                          width: 7,
                          height: 7,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: gradient.first,
                          ),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          f,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: isDark
                                ? Colors.white.withValues(alpha: 0.85)
                                : const Color(0xFF27272A),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Wrap(
                spacing: 12,
                runSpacing: 10,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  FilledButton(
                    onPressed: onStart,
                    style: FilledButton.styleFrom(
                      backgroundColor: gradient.first,
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          cta,
                          style: const TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Icon(Icons.arrow_forward, size: 15, color: Colors.white),
                      ],
                    ),
                  ),
                  if (onSignIn != null)
                    InkWell(
                      onTap: onSignIn,
                      borderRadius: BorderRadius.circular(8),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                        child: Text.rich(
                          TextSpan(
                            style: TextStyle(
                              fontSize: 12.5,
                              color: isDark
                                  ? Colors.white.withValues(alpha: 0.7)
                                  : const Color(0xFF52525B),
                            ),
                            children: [
                              const TextSpan(text: 'Already a member? '),
                              TextSpan(
                                text: 'Sign In',
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  color: gradient.first,
                                  decoration: TextDecoration.underline,
                                  decorationColor: gradient.first,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
