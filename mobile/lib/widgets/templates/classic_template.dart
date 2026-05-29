import 'package:flutter/material.dart';
import 'template_data.dart';

const _navy = Color(0xFF1E3A8A);
const _ink = Color(0xFF0B1B3A);
const _muted = Color(0xFF27314D);
const _cream = Color(0xFFFBF7EE);

class ClassicTemplate extends StatelessWidget {
  const ClassicTemplate({super.key, required this.data});
  final TemplateData data;

  @override
  Widget build(BuildContext context) {
    final eduList = data.enabledEducation;
    final skills = data.highlightedSkills;
    return Container(
      color: _cream,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: _navy, width: 2)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        data.fullName.toUpperCase(),
                        style: const TextStyle(
                          fontFamily: 'serif',
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: _ink,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        data.shortRole,
                        style: const TextStyle(
                          fontFamily: 'serif',
                          fontStyle: FontStyle.italic,
                          fontSize: 11,
                          color: _navy,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 12,
                        runSpacing: 4,
                        children: [
                          _line('✉', data.user.email),
                          if (data.user.mobile != null) _line('☎', '+91 ${data.user.mobile}'),
                          if (data.profile.alternateMobile != null)
                            _line('☎', '+91 ${data.profile.alternateMobile}'),
                          if (data.profile.preferredLocation != null)
                            _line('◉', data.profile.preferredLocation!),
                        ],
                      ),
                    ],
                  ),
                ),
                if (data.profile.photoDataUrl != null) ...[
                  const SizedBox(width: 14),
                  Container(
                    decoration: BoxDecoration(border: Border.all(color: _navy, width: 2)),
                    child: photoOrInitials(
                      data: data,
                      size: 70,
                      borderRadius: BorderRadius.zero,
                      backgroundDecoration: const BoxDecoration(color: _navy),
                      initialsStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 22),
                    ),
                  ),
                ],
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (data.profile.shortTermAmbition != null || data.profile.longTermAmbition != null)
                  _section('Profile', Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (data.profile.shortTermAmbition != null)
                        Text(data.profile.shortTermAmbition!, style: const TextStyle(fontFamily: 'serif', fontSize: 11, color: _ink, height: 1.5)),
                      if (data.profile.longTermAmbition != null) ...[
                        const SizedBox(height: 4),
                        Text(data.profile.longTermAmbition!, style: const TextStyle(fontFamily: 'serif', fontSize: 11, color: _muted, height: 1.5)),
                      ],
                    ],
                  )),

                if (data.profile.experiences != null && data.profile.experiences!.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  _section('Professional Experience', Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: data.profile.experiences!.map((e) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    e.role.isEmpty ? 'Role' : e.role,
                                    style: const TextStyle(fontFamily: 'serif', fontSize: 11.5, fontWeight: FontWeight.w700, color: _ink),
                                  ),
                                ),
                                Text(
                                  TemplateData.formatPeriod(e.fromDate, e.toDate),
                                  style: const TextStyle(fontFamily: 'serif', fontSize: 9.5, color: _muted),
                                ),
                              ],
                            ),
                            Text(
                              e.company.isEmpty ? 'Company' : e.company,
                              style: const TextStyle(fontFamily: 'serif', fontSize: 11, color: _navy),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  )),
                ],

                if (eduList.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  _section('Education', Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: eduList.map((e) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    TemplateData.eduLabel(e),
                                    style: const TextStyle(fontFamily: 'serif', fontSize: 11.5, fontWeight: FontWeight.w700, color: _ink),
                                  ),
                                ),
                                Text(
                                  '${e.passedOutYear ?? "—"}',
                                  style: const TextStyle(fontFamily: 'serif', fontSize: 9.5, color: _muted),
                                ),
                              ],
                            ),
                            if (e.institution != null)
                              Text(e.institution!, style: const TextStyle(fontFamily: 'serif', fontSize: 10.5, color: _muted)),
                            if (e.percentage != null)
                              Text('Score: ${e.percentage}%', style: const TextStyle(fontFamily: 'serif', fontSize: 10, color: _muted, fontStyle: FontStyle.italic)),
                            if (e.thesis != null)
                              Text('"${e.thesis}"', style: const TextStyle(fontFamily: 'serif', fontSize: 10.5, color: _ink, fontStyle: FontStyle.italic)),
                          ],
                        ),
                      );
                    }).toList(),
                  )),
                ],

                if (skills.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  _section('Key Skills', Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: skills.map((s) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          border: Border.all(color: _navy.withValues(alpha: 0.4)),
                          borderRadius: BorderRadius.circular(2),
                        ),
                        child: Text(s, style: const TextStyle(fontFamily: 'serif', fontSize: 10, color: _ink)),
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

  Widget _line(String icon, String value) {
    return Text(
      '$icon  $value',
      style: const TextStyle(fontFamily: 'serif', fontSize: 9.5, color: _muted),
    );
  }

  Widget _section(String title, Widget child) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.only(bottom: 4),
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: _navy, width: 0.6)),
          ),
          child: const Text(
            '',
          ),
        ),
        Text(
          title.toUpperCase(),
          style: const TextStyle(
            fontFamily: 'serif',
            fontSize: 9.5,
            letterSpacing: 2,
            fontWeight: FontWeight.w800,
            color: _navy,
          ),
        ),
        Container(height: 1, color: _navy, margin: const EdgeInsets.only(top: 2, bottom: 8)),
        child,
      ],
    );
  }
}
