import 'package:flutter/material.dart';
import 'template_data.dart';

const _accent = Color(0xFF0284C7);
const _ink = Color(0xFF18181B);
const _muted = Color(0xFF52525B);
const _bgLight = Color(0xFFFAFAFA);

class ModernTemplate extends StatelessWidget {
  const ModernTemplate({super.key, required this.data});
  final TemplateData data;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Left rail
          Expanded(
            flex: 4,
            child: Container(
              color: _bgLight,
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  photoOrInitials(
                    data: data,
                    size: 80,
                    backgroundDecoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(colors: [_accent, Color(0xFF0369A1)]),
                    ),
                    initialsStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 24),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    data.fullName,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: _ink, letterSpacing: -0.3),
                  ),
                  Text(
                    data.shortRole,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 10, color: _muted),
                  ),
                  const SizedBox(height: 16),
                  _block('CONTACT', Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _smallText(data.user.email, dim: true),
                      if (data.user.mobile != null) _smallText('+91 ${data.user.mobile}'),
                      if (data.profile.alternateMobile != null)
                        _smallText('+91 ${data.profile.alternateMobile}', dim: true),
                      if (data.profile.preferredLocation != null) ...[
                        const SizedBox(height: 4),
                        _smallText('📍 ${data.profile.preferredLocation}'),
                      ],
                    ],
                  )),
                  if (data.highlightedSkills.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    _block('SKILLS', Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: data.highlightedSkills.map((s) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2),
                          child: Row(
                            children: [
                              Container(width: 4, height: 4, decoration: const BoxDecoration(color: _accent, shape: BoxShape.circle)),
                              const SizedBox(width: 6),
                              Expanded(child: Text(s, style: const TextStyle(fontSize: 10, color: _muted))),
                            ],
                          ),
                        );
                      }).toList(),
                    )),
                  ],
                  if (data.profile.yearsOfExperience != null && data.profile.yearsOfExperience! > 0) ...[
                    const SizedBox(height: 14),
                    _block('EXPERIENCE', Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text('${data.profile.yearsOfExperience}', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: _accent)),
                        const SizedBox(width: 4),
                        const Text('yrs', style: TextStyle(fontSize: 10, color: _muted)),
                      ],
                    )),
                  ],
                ],
              ),
            ),
          ),
          // Right content
          Expanded(
            flex: 8,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('PROFILE', style: TextStyle(fontSize: 9, letterSpacing: 2.5, fontWeight: FontWeight.w800, color: _accent)),
                  const SizedBox(height: 4),
                  Text(data.shortRole, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: _ink, letterSpacing: -0.2)),
                  if (data.profile.shortTermAmbition != null) ...[
                    const SizedBox(height: 6),
                    Text(data.profile.shortTermAmbition!, style: const TextStyle(fontSize: 10.5, color: _muted, height: 1.5)),
                  ],
                  if (data.profile.longTermAmbition != null) ...[
                    const SizedBox(height: 4),
                    Text(data.profile.longTermAmbition!, style: const TextStyle(fontSize: 10.5, color: Color(0xFF71717A), height: 1.5)),
                  ],
                  if (data.profile.experiences != null && data.profile.experiences!.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    _sectionHeader('EXPERIENCE'),
                    ...data.profile.experiences!.map((e) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(child: Text(e.role.isEmpty ? 'Role' : e.role, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: _ink))),
                                Text(TemplateData.formatPeriod(e.fromDate, e.toDate), style: const TextStyle(fontSize: 9, color: _muted)),
                              ],
                            ),
                            Text(e.company.isEmpty ? 'Company' : e.company, style: const TextStyle(fontSize: 10.5, color: _accent)),
                          ],
                        ),
                      );
                    }),
                  ],
                  if (data.enabledEducation.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    _sectionHeader('EDUCATION'),
                    ...data.enabledEducation.map((e) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(child: Text(TemplateData.eduLabel(e), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: _ink))),
                                Text('${e.passedOutYear ?? "—"}', style: const TextStyle(fontSize: 9, color: _muted)),
                              ],
                            ),
                            if (e.institution != null)
                              Text(e.institution!, style: const TextStyle(fontSize: 10, color: _muted)),
                            if (e.percentage != null)
                              Text('${e.percentage}%', style: const TextStyle(fontSize: 9.5, color: Color(0xFF71717A))),
                            if (e.thesis != null)
                              Text('"${e.thesis}"', style: const TextStyle(fontSize: 10, color: _muted, fontStyle: FontStyle.italic)),
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

  Widget _block(String title, Widget child) {
    return SizedBox(
      width: double.infinity,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 8.5, letterSpacing: 1.5, fontWeight: FontWeight.w800, color: Color(0xFFA1A1AA))),
          const SizedBox(height: 4),
          child,
        ],
      ),
    );
  }

  Widget _smallText(String t, {bool dim = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 1),
      child: Text(
        t,
        style: TextStyle(fontSize: 9.5, color: dim ? const Color(0xFFA1A1AA) : _muted),
      ),
    );
  }

  Widget _sectionHeader(String title) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.only(bottom: 4),
      margin: const EdgeInsets.only(bottom: 6),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: Color(0xFFE4E4E7))),
      ),
      child: Padding(
        padding: const EdgeInsets.only(top: 6),
        child: Text(title, style: const TextStyle(fontSize: 9, letterSpacing: 2.5, fontWeight: FontWeight.w800, color: _accent)),
      ),
    );
  }
}
