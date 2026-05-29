import 'package:flutter/material.dart';
import 'template_data.dart';

class CreativeTemplate extends StatelessWidget {
  const CreativeTemplate({super.key, required this.data});
  final TemplateData data;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFFFF8F1),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Hero
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFFF97316), Color(0xFFE11D48), Color(0xFFC026D3)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Row(
              children: [
                photoOrInitials(
                  data: data,
                  size: 70,
                  borderRadius: BorderRadius.circular(20),
                  backgroundDecoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    color: Colors.white.withValues(alpha: 0.15),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.4), width: 3),
                  ),
                  initialsStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "HELLO, I'M",
                        style: TextStyle(fontSize: 9, letterSpacing: 3, fontWeight: FontWeight.w800, color: Colors.white.withValues(alpha: 0.85)),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        data.fullName,
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -0.5),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        data.shortRole,
                        style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.92)),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 4,
                        runSpacing: 4,
                        children: [
                          _pill('✉ ${data.user.email}'),
                          if (data.user.mobile != null) _pill('☎ +91 ${data.user.mobile}'),
                          if (data.profile.preferredLocation != null) _pill('◉ ${data.profile.preferredLocation}'),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (data.profile.shortTermAmbition != null || data.profile.longTermAmbition != null)
                  _card('My Story', const [Color(0xFFF97316), Color(0xFFE11D48)], Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (data.profile.shortTermAmbition != null)
                        RichText(
                          text: TextSpan(style: const TextStyle(fontSize: 11, color: Color(0xFF52525B), height: 1.5), children: [
                            const TextSpan(text: 'Soon: ', style: TextStyle(color: Color(0xFFC2410C), fontWeight: FontWeight.w700)),
                            TextSpan(text: data.profile.shortTermAmbition),
                          ]),
                        ),
                      if (data.profile.longTermAmbition != null) ...[
                        const SizedBox(height: 4),
                        RichText(
                          text: TextSpan(style: const TextStyle(fontSize: 11, color: Color(0xFF52525B), height: 1.5), children: [
                            const TextSpan(text: 'Eventually: ', style: TextStyle(color: Color(0xFFA21CAF), fontWeight: FontWeight.w700)),
                            TextSpan(text: data.profile.longTermAmbition),
                          ]),
                        ),
                      ],
                    ],
                  )),

                if (data.profile.experiences != null && data.profile.experiences!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  _card('Experience', const [Color(0xFFC026D3), Color(0xFF7C3AED)], Column(
                    children: data.profile.experiences!.map((e) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 6),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 6, offset: const Offset(0, 2))],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(child: Text(e.role.isEmpty ? 'Role' : e.role, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700))),
                                Text(TemplateData.formatPeriod(e.fromDate, e.toDate), style: const TextStyle(fontSize: 9, color: Color(0xFFC026D3), fontWeight: FontWeight.w700)),
                              ],
                            ),
                            Text(e.company.isEmpty ? 'Company' : e.company, style: const TextStyle(fontSize: 10.5, color: Color(0xFFEA580C))),
                          ],
                        ),
                      );
                    }).toList(),
                  )),
                ],

                if (data.enabledEducation.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  _card('Education', const [Color(0xFFD97706), Color(0xFFF97316)], Column(
                    children: data.enabledEducation.map((e) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 4),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 6, offset: const Offset(0, 2))],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(children: [
                              Expanded(child: Text(TemplateData.eduLabel(e), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700))),
                              Text('${e.passedOutYear ?? "—"}', style: const TextStyle(fontSize: 9, color: Color(0xFFD97706), fontWeight: FontWeight.w700)),
                            ]),
                            if (e.institution != null)
                              Text(e.institution!, style: const TextStyle(fontSize: 10, color: Color(0xFF71717A))),
                            if (e.percentage != null)
                              Text('${e.percentage}%', style: const TextStyle(fontSize: 9.5, color: Color(0xFFA1A1AA))),
                          ],
                        ),
                      );
                    }).toList(),
                  )),
                ],

                if (data.highlightedSkills.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  _card('Skills', const [Color(0xFF06B6D4), Color(0xFF0EA5E9)], Wrap(
                    spacing: 5,
                    runSpacing: 5,
                    children: data.highlightedSkills.map((s) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [Color(0xFFFFEDD5), Color(0xFFFFE4E6)]),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(s, style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: Color(0xFFC2410C))),
                      );
                    }).toList(),
                  )),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _pill(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: Colors.white.withValues(alpha: 0.18),
        border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
      ),
      child: Text(text, style: const TextStyle(fontSize: 9, color: Colors.white)),
    );
  }

  Widget _card(String title, List<Color> grad, Widget child) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.65),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ShaderMask(
            shaderCallback: (b) => LinearGradient(colors: grad).createShader(b),
            child: Text(
              title.toUpperCase(),
              style: const TextStyle(fontSize: 9, letterSpacing: 2.5, fontWeight: FontWeight.w800, color: Colors.white),
            ),
          ),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}
