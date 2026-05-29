import 'package:flutter/material.dart';
import 'template_data.dart';

const _bg = Color(0xFF0A0F0D);
const _emerald = Color(0xFF34D399);
const _emeraldDim = Color(0xFF10B981);
const _cyan = Color(0xFF67E8F9);
const _zincLight = Color(0xFFE5E7EB);
const _zincMid = Color(0xFF9CA3AF);

const _mono = TextStyle(
  fontFamily: 'monospace',
  color: _zincLight,
);

class TechMonoTemplate extends StatelessWidget {
  const TechMonoTemplate({super.key, required this.data});
  final TemplateData data;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: _bg,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: Color(0xFF064E3B))),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                photoOrInitials(
                  data: data,
                  size: 60,
                  borderRadius: BorderRadius.circular(8),
                  backgroundDecoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    color: _emerald.withValues(alpha: 0.05),
                    border: Border.all(color: _emerald.withValues(alpha: 0.4)),
                  ),
                  initialsStyle: const TextStyle(color: _emerald, fontWeight: FontWeight.w700, fontSize: 18, fontFamily: 'monospace'),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(r'$ whoami', style: _mono.copyWith(color: _emerald, fontSize: 9, letterSpacing: 1.5)),
                      const SizedBox(height: 2),
                      Text(data.fullName, style: _mono.copyWith(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
                      Text('// ${data.shortRole}', style: _mono.copyWith(color: _emerald, fontSize: 10)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 18,
                  runSpacing: 4,
                  children: [
                    _kv('email', data.user.email),
                    if (data.user.mobile != null) _kv('phone', '+91 ${data.user.mobile}'),
                    if (data.profile.preferredLocation != null) _kv('loc', data.profile.preferredLocation!),
                    if (data.profile.yearsOfExperience != null && data.profile.yearsOfExperience! > 0)
                      _kv('exp', '${data.profile.yearsOfExperience}y'),
                  ],
                ),
                const SizedBox(height: 14),

                if (data.profile.shortTermAmbition != null || data.profile.longTermAmbition != null)
                  _section('profile', Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (data.profile.shortTermAmbition != null)
                        RichText(
                          text: TextSpan(style: _mono.copyWith(fontSize: 10.5, height: 1.5), children: [
                            TextSpan(text: '// short: ', style: _mono.copyWith(color: _emerald, fontSize: 10.5)),
                            TextSpan(text: data.profile.shortTermAmbition),
                          ]),
                        ),
                      if (data.profile.longTermAmbition != null) ...[
                        const SizedBox(height: 4),
                        RichText(
                          text: TextSpan(style: _mono.copyWith(fontSize: 10.5, color: _zincMid, height: 1.5), children: [
                            TextSpan(text: '// long: ', style: _mono.copyWith(color: _emerald, fontSize: 10.5)),
                            TextSpan(text: data.profile.longTermAmbition),
                          ]),
                        ),
                      ],
                    ],
                  )),

                if (data.profile.experiences != null && data.profile.experiences!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  _section('experience', Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: data.profile.experiences!.map((e) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Row(
                          children: [
                            Expanded(
                              child: RichText(
                                text: TextSpan(style: _mono.copyWith(fontSize: 11), children: [
                                  TextSpan(text: e.role.isEmpty ? 'role' : e.role, style: _mono.copyWith(color: _emerald, fontSize: 11)),
                                  TextSpan(text: ' @ ', style: _mono.copyWith(color: _zincMid, fontSize: 11)),
                                  TextSpan(text: e.company.isEmpty ? 'company' : e.company, style: _mono.copyWith(color: _cyan, fontSize: 11)),
                                ]),
                              ),
                            ),
                            Text(TemplateData.formatPeriod(e.fromDate, e.toDate), style: _mono.copyWith(color: _zincMid, fontSize: 9)),
                          ],
                        ),
                      );
                    }).toList(),
                  )),
                ],

                if (data.enabledEducation.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  _section('education', Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: data.enabledEducation.map((e) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: RichText(
                                text: TextSpan(style: _mono.copyWith(fontSize: 10.5), children: [
                                  TextSpan(text: TemplateData.eduLabel(e), style: _mono.copyWith(color: _cyan, fontSize: 10.5)),
                                  if (e.institution != null) TextSpan(text: ' @ ${e.institution}', style: _mono.copyWith(color: _zincMid, fontSize: 10.5)),
                                  if (e.percentage != null) TextSpan(text: ' · ${e.percentage}%', style: _mono.copyWith(color: _emerald, fontSize: 10.5)),
                                ]),
                              ),
                            ),
                            Text('${e.passedOutYear ?? "—"}', style: _mono.copyWith(color: _zincMid, fontSize: 9)),
                          ],
                        ),
                      );
                    }).toList(),
                  )),
                ],

                if (data.highlightedSkills.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  _section('skills.json', Wrap(
                    spacing: 5,
                    runSpacing: 5,
                    children: data.highlightedSkills.map((s) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: _emerald.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: _emerald.withValues(alpha: 0.4)),
                        ),
                        child: Text(s, style: _mono.copyWith(color: _emerald, fontSize: 10)),
                      );
                    }).toList(),
                  )),
                ],
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: Color(0xFF064E3B))),
            ),
            child: RichText(
              text: TextSpan(style: _mono.copyWith(fontSize: 9.5, color: _emeraldDim), children: [
                TextSpan(text: r'$ ', style: _mono.copyWith(color: _emerald, fontSize: 9.5)),
                const TextSpan(text: 'end_of_profile'),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _kv(String k, String v) {
    return RichText(
      text: TextSpan(style: _mono.copyWith(fontSize: 10), children: [
        TextSpan(text: '$k:', style: _mono.copyWith(color: _emerald, fontSize: 10)),
        const TextSpan(text: ' '),
        TextSpan(text: v, style: _mono.copyWith(color: _zincLight, fontSize: 10)),
      ]),
    );
  }

  Widget _section(String title, Widget child) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RichText(
          text: TextSpan(style: _mono.copyWith(fontSize: 10.5, color: _emerald), children: [
            TextSpan(text: '> ', style: _mono.copyWith(color: _emeraldDim, fontSize: 10.5)),
            TextSpan(text: title),
          ]),
        ),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.only(left: 10),
          decoration: BoxDecoration(
            border: Border(left: BorderSide(color: _emerald.withValues(alpha: 0.2))),
          ),
          child: child,
        ),
      ],
    );
  }
}
