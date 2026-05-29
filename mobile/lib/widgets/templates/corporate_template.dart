import 'package:flutter/material.dart';
import 'template_data.dart';

class CorporateTemplate extends StatelessWidget {
  const CorporateTemplate({super.key, required this.data});
  final TemplateData data;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Dark sidebar
          Expanded(
            flex: 5,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF0F172A), Color(0xFF1E293B), Color(0xFF0F172A)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  photoOrInitials(
                    data: data,
                    size: 80,
                    borderRadius: BorderRadius.circular(16),
                    backgroundDecoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      color: const Color(0xFF334155),
                    ),
                    initialsStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 20),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    data.fullName,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -0.3),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    data.shortRole.toUpperCase(),
                    style: const TextStyle(fontSize: 8.5, letterSpacing: 1.5, color: Color(0xFF94A3B8)),
                  ),
                  const SizedBox(height: 14),
                  _sb('CONTACT', Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(data.user.email, style: const TextStyle(fontSize: 9.5, color: Color(0xFFCBD5E1))),
                      if (data.user.mobile != null)
                        Text('+91 ${data.user.mobile}', style: const TextStyle(fontSize: 9.5, color: Color(0xFFCBD5E1))),
                      if (data.profile.alternateMobile != null)
                        Text('+91 ${data.profile.alternateMobile}', style: const TextStyle(fontSize: 9.5, color: Color(0xFF94A3B8))),
                      if (data.profile.preferredLocation != null) ...[
                        const SizedBox(height: 4),
                        Text('📍 ${data.profile.preferredLocation}', style: const TextStyle(fontSize: 9.5, color: Color(0xFFCBD5E1))),
                      ],
                    ],
                  )),
                  if (data.highlightedSkills.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    _sb('TOP SKILLS', Wrap(
                      spacing: 4,
                      runSpacing: 4,
                      children: data.highlightedSkills.map((s) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E293B),
                            border: Border.all(color: const Color(0xFF334155)),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(s, style: const TextStyle(fontSize: 9, color: Color(0xFFE2E8F0))),
                        );
                      }).toList(),
                    )),
                  ],
                  if (data.profile.yearsOfExperience != null && data.profile.yearsOfExperience! > 0) ...[
                    const SizedBox(height: 14),
                    _sb('EXPERIENCE', Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text('${data.profile.yearsOfExperience}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Color(0xFF34D399))),
                        const SizedBox(width: 4),
                        const Text('years', style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
                      ],
                    )),
                  ],
                ],
              ),
            ),
          ),
          // Light main
          Expanded(
            flex: 7,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (data.profile.shortTermAmbition != null || data.profile.longTermAmbition != null) ...[
                    const Text('PROFILE', style: TextStyle(fontSize: 9, letterSpacing: 2.5, fontWeight: FontWeight.w800, color: Color(0xFF047857))),
                    const SizedBox(height: 6),
                    if (data.profile.shortTermAmbition != null)
                      Text(data.profile.shortTermAmbition!, style: const TextStyle(fontSize: 10.5, color: Color(0xFF334155), height: 1.5)),
                    if (data.profile.longTermAmbition != null) ...[
                      const SizedBox(height: 4),
                      Text(data.profile.longTermAmbition!, style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B), height: 1.5)),
                    ],
                    const SizedBox(height: 14),
                  ],
                  if (data.profile.experiences != null && data.profile.experiences!.isNotEmpty) ...[
                    const Text('EXPERIENCE', style: TextStyle(fontSize: 9, letterSpacing: 2.5, fontWeight: FontWeight.w800, color: Color(0xFF047857))),
                    const SizedBox(height: 6),
                    ...data.profile.experiences!.map((e) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.only(left: 10),
                        decoration: const BoxDecoration(
                          border: Border(left: BorderSide(color: Color(0xFF10B981), width: 2)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(children: [
                              Expanded(child: Text(e.role.isEmpty ? 'Role' : e.role, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)))),
                              Text(TemplateData.formatPeriod(e.fromDate, e.toDate), style: const TextStyle(fontSize: 9, color: Color(0xFF64748B))),
                            ]),
                            Text(e.company.isEmpty ? 'Company' : e.company, style: const TextStyle(fontSize: 10.5, color: Color(0xFF047857))),
                          ],
                        ),
                      );
                    }),
                    const SizedBox(height: 14),
                  ],
                  if (data.enabledEducation.isNotEmpty) ...[
                    const Text('EDUCATION', style: TextStyle(fontSize: 9, letterSpacing: 2.5, fontWeight: FontWeight.w800, color: Color(0xFF047857))),
                    const SizedBox(height: 6),
                    ...data.enabledEducation.map((e) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 6),
                        padding: const EdgeInsets.only(left: 10),
                        decoration: const BoxDecoration(
                          border: Border(left: BorderSide(color: Color(0xFFCBD5E1), width: 2)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(children: [
                              Expanded(child: Text(TemplateData.eduLabel(e), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)))),
                              Text('${e.passedOutYear ?? "—"}', style: const TextStyle(fontSize: 9, color: Color(0xFF64748B))),
                            ]),
                            if (e.institution != null)
                              Text(e.institution!, style: const TextStyle(fontSize: 10, color: Color(0xFF475569))),
                            if (e.percentage != null)
                              Text('Score: ${e.percentage}%', style: const TextStyle(fontSize: 9.5, color: Color(0xFF64748B))),
                          ],
                        ),
                      );
                    }),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sb(String title, Widget child) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 8.5, letterSpacing: 2, fontWeight: FontWeight.w800, color: Color(0xFF34D399))),
        const SizedBox(height: 4),
        child,
      ],
    );
  }
}
