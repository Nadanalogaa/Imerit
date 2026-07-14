import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/theme_provider.dart';
import '../store/auth_provider.dart';
import '../widgets/brand_logo.dart';
import '../widgets/theme_toggle.dart';
import '../widgets/bottom_nav.dart';
import '../widgets/welcome_banner.dart';
import '../widgets/sign_in_chip.dart';
import '../widgets/user_avatar_menu.dart';
import '../widgets/landing/entry_cards.dart';
import '../widgets/landing/why_us.dart';
import '../widgets/landing/about_us.dart';
import '../widgets/landing/suggestion_form.dart';
import '../widgets/landing/contact_us.dart';
import '../widgets/landing/footer.dart';

class LandingPage extends ConsumerStatefulWidget {
  const LandingPage({super.key});

  @override
  ConsumerState<LandingPage> createState() => _LandingPageState();
}

class _LandingPageState extends ConsumerState<LandingPage> {
  int _navIndex = 0;
  final _scroll = ScrollController();

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _onNavTap(int i) {
    setState(() => _navIndex = i);
    final loggedIn = ref.read(authProvider) != null;
    switch (i) {
      case 0:
        _scroll.animateTo(
          0,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeOut,
        );
      case 1:
        context.go('/employer'); // browse jobs (placeholder)
      case 2:
        context.go(loggedIn ? '/candidate/dashboard' : '/candidate/register');
      case 3:
        context.go(loggedIn ? '/candidate/dashboard' : '/candidate/login');
      case 4:
        context.go('/admin');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final user = ref.watch(authProvider);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(60),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Row(
              children: [
                const BrandLogo(size: BrandLogoSize.medium, plateColor: Colors.white),
                const Spacer(),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 250),
                  transitionBuilder: (child, anim) => FadeTransition(
                    opacity: anim,
                    child: ScaleTransition(scale: anim, child: child),
                  ),
                  child: user != null
                      ? UserAvatarMenu(key: const ValueKey('avatar'), user: user)
                      : SignInChip(
                          key: const ValueKey('signin'),
                          onCandidate: (action) => context.go(
                            action == 'login'
                                ? '/candidate/login'
                                : '/candidate/register',
                          ),
                          onEmployer: (_) => context.go('/employer'),
                        ),
                ),
                const SizedBox(width: 8),
                const ThemeToggle(),
              ],
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        controller: _scroll,
        child: Column(
          children: [
            WelcomeBanner(
              onCandidate: (action) => context.go(
                action == 'login'
                    ? '/candidate/login'
                    : '/candidate/register',
              ),
              onEmployer: (_) => context.go('/employer'),
            ),
            // Carousel is intentionally not shown on mobile — vertical real
            // estate is precious and the role cards below are the only thing
            // a visitor actually needs to decide. Vision / mission copy
            // surfaces in the AboutUs section further down the page.
            EntryCards(
              isDark: isDark,
              onCandidate: () => context.go('/candidate/register'),
              onEmployer: () => context.go('/employer'),
            ),
            WhyUs(isDark: isDark),
            AboutUs(isDark: isDark),
            const SuggestionForm(),
            ContactUs(isDark: isDark),
            LandingFooter(isDark: isDark),
          ],
        ),
      ),
      bottomNavigationBar: AppBottomNav(
        currentIndex: _navIndex,
        onTap: _onNavTap,
      ),
    );
  }
}
