import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../store/jobs_provider.dart';

/// Skill chip input with field-scoped auto-suggestions. Split IT vs Non-IT so
/// employers see relevant hints instead of a 150-item soup. The suggestion
/// list live-filters as the employer types, and tapping a chip locks it in
/// with a haptic tick. Mirrors the web `SKILL_SUGGESTIONS_IT` +
/// `SKILL_SUGGESTIONS_NON_IT` + `SKILL_SUGGESTIONS_COMMON` split.
class SkillChipInput extends StatefulWidget {
  const SkillChipInput({
    super.key,
    required this.value,
    required this.onChange,
    required this.field,
    this.max = 12,
  });
  final List<String> value;
  final ValueChanged<List<String>> onChange;
  final JobField field;
  final int max;

  @override
  State<SkillChipInput> createState() => _SkillChipInputState();
}

class _SkillChipInputState extends State<SkillChipInput> {
  final _ctrl = TextEditingController();
  final _focus = FocusNode();

  static const _it = [
    'React', 'React Native', 'Next.js', 'Vue', 'Angular', 'TypeScript', 'JavaScript',
    'Node.js', 'Express', 'NestJS', 'Python', 'Django', 'FastAPI', 'Flask',
    'Java', 'Spring Boot', 'Kotlin', 'C#', '.NET Core', 'Go', 'Rust', 'Elixir',
    'PHP', 'Laravel', 'Ruby on Rails', 'Flutter', 'Dart', 'Swift', 'iOS', 'Android',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'ClickHouse',
    'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD',
    'Git', 'GraphQL', 'REST API', 'gRPC', 'WebSockets', 'RabbitMQ', 'Kafka',
    'HTML/CSS', 'Tailwind CSS', 'SCSS', 'Figma', 'UI/UX Design',
    'Machine Learning', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision',
    'Data Engineering', 'Airflow', 'dbt', 'Spark', 'Snowflake',
    'Cybersecurity', 'Penetration Testing', 'DevSecOps', 'SRE',
  ];

  static const _nonIt = [
    'Sales', 'Business Development', 'Account Management', 'Field Sales',
    'Digital Marketing', 'SEO', 'SEM', 'Content Marketing', 'Social Media',
    'Recruitment', 'HR Operations', 'Payroll', 'Compensation & Benefits',
    'Accounting', 'Tally', 'GST', 'Auditing', 'Taxation', 'Financial Modeling',
    'Excel', 'Advanced Excel', 'Power BI', 'Tableau',
    'Customer Support', 'Voice Process', 'Chat Support', 'Email Support',
    'Operations', 'Supply Chain', 'Logistics', 'Warehouse Management',
    'Civil Engineering', 'AutoCAD', 'Site Management', 'Quantity Surveying',
    'Mechanical Engineering', 'Electrical Engineering', 'HVAC', 'Solar',
    'Nursing', 'Pharmacy', 'Lab Technician', 'Physiotherapy',
    'Teaching', 'Tutoring', 'Curriculum Design',
    'Delivery', 'Driver', 'Bike Rider', 'Field Executive',
    'Tamil', 'English', 'Hindi', 'Malayalam', 'Telugu',
    'MS Office', 'Communication', 'Leadership', 'Team Management',
  ];

  static const _common = [
    'Communication', 'Leadership', 'Problem Solving', 'Team Work',
    'Time Management', 'Adaptability', 'Critical Thinking',
  ];

  @override
  void dispose() {
    _ctrl.dispose();
    _focus.dispose();
    super.dispose();
  }

  List<String> get _pool =>
      widget.field == JobField.it ? [..._it, ..._common] : [..._nonIt, ..._common];

  List<String> get _suggestions {
    final q = _ctrl.text.trim().toLowerCase();
    final used = widget.value.map((s) => s.toLowerCase()).toSet();
    return _pool
        .where((s) => !used.contains(s.toLowerCase()))
        .where((s) => q.isEmpty || s.toLowerCase().contains(q))
        .take(q.isEmpty ? 8 : 12)
        .toList();
  }

  void _add(String raw) {
    final v = raw.trim();
    if (v.isEmpty) return;
    if (widget.value.length >= widget.max) return;
    if (widget.value.any((s) => s.toLowerCase() == v.toLowerCase())) return;
    HapticFeedback.selectionClick();
    widget.onChange([...widget.value, v]);
    _ctrl.clear();
    setState(() {});
  }

  void _remove(String s) {
    HapticFeedback.lightImpact();
    widget.onChange(widget.value.where((v) => v != s).toList());
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE4E4E7)),
          ),
          child: Wrap(
            spacing: 6,
            runSpacing: 6,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              ...widget.value.map((s) => _SelectedChip(label: s, onRemove: () => _remove(s))),
              SizedBox(
                width: widget.value.isEmpty ? double.infinity : 160,
                child: TextField(
                  controller: _ctrl,
                  focusNode: _focus,
                  onChanged: (_) => setState(() {}),
                  onSubmitted: _add,
                  textInputAction: TextInputAction.done,
                  style: const TextStyle(fontSize: 13),
                  decoration: const InputDecoration(
                    hintText: 'Type a skill and hit enter',
                    hintStyle: TextStyle(fontSize: 12, color: Color(0xFFA1A1AA)),
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(horizontal: 4, vertical: 6),
                    border: InputBorder.none,
                  ),
                ),
              ),
            ],
          ),
        ),
        if (_suggestions.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            _ctrl.text.trim().isEmpty ? 'Popular in ${widget.field == JobField.it ? "IT" : "Non-IT"}' : 'Matches',
            style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: 1.4, color: Color(0xFF71717A)),
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: _suggestions.map((s) => _SuggestionChip(label: s, onAdd: () => _add(s))).toList(),
          ),
        ],
        const SizedBox(height: 4),
        Text(
          '${widget.value.length}/${widget.max} skills · long-press to remove',
          style: const TextStyle(fontSize: 10, color: Color(0xFF71717A)),
        ),
      ],
    );
  }
}

class _SelectedChip extends StatelessWidget {
  const _SelectedChip({required this.label, required this.onRemove});
  final String label;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onLongPress: onRemove,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF4F46E5)]),
          borderRadius: BorderRadius.circular(999),
          boxShadow: [BoxShadow(color: const Color(0xFF6366F1).withValues(alpha: 0.35), blurRadius: 6, offset: const Offset(0, 3))],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(label, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: Colors.white)),
            const SizedBox(width: 6),
            InkWell(
              onTap: onRemove,
              borderRadius: BorderRadius.circular(999),
              child: const Icon(Icons.close_rounded, size: 12, color: Colors.white),
            ),
          ],
        ),
      ),
    );
  }
}

class _SuggestionChip extends StatelessWidget {
  const _SuggestionChip({required this.label, required this.onAdd});
  final String label;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onAdd,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: const Color(0xFF6366F1).withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: const Color(0xFF6366F1).withValues(alpha: 0.25)),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.add_rounded, size: 11, color: Color(0xFF4F46E5)),
            const SizedBox(width: 4),
            Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF4F46E5))),
          ]),
        ),
      ),
    );
  }
}
