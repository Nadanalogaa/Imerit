import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../store/profile_provider.dart';
import '../../store/theme_provider.dart';
import 'chip_input.dart';

/// Standalone-projects editor for the candidate profile wizard.
/// Mirrors the web ProjectsEditor: name (required), role, description,
/// showcase URL, skills, and start / end year. Sends the whole list to
/// PUT /candidate/profile/projects on save via the profile store.
class ProjectsEditor extends ConsumerWidget {
  const ProjectsEditor({super.key, required this.value, required this.onChange});

  final List<CandidateProject> value;
  final ValueChanged<List<CandidateProject>> onChange;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (int i = 0; i < value.length; i++) ...[
          _ProjectCard(
            key: ValueKey('project-$i'),
            project: value[i],
            isDark: isDark,
            onChange: (next) {
              final list = [...value];
              list[i] = next;
              onChange(list);
            },
            onRemove: () {
              final list = [...value]..removeAt(i);
              onChange(list);
            },
          ),
          const SizedBox(height: 10),
        ],
        OutlinedButton.icon(
          onPressed: () => onChange([...value, const CandidateProject(name: '')]),
          icon: const Icon(Icons.add_rounded, size: 16),
          label: const Text('Add project', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800)),
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFFEA580C),
            side: const BorderSide(color: Color(0xFFF97316), width: 1.4),
            padding: const EdgeInsets.symmetric(vertical: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
        ),
      ],
    );
  }
}

class _ProjectCard extends StatefulWidget {
  const _ProjectCard({
    super.key,
    required this.project,
    required this.isDark,
    required this.onChange,
    required this.onRemove,
  });
  final CandidateProject project;
  final bool isDark;
  final ValueChanged<CandidateProject> onChange;
  final VoidCallback onRemove;

  @override
  State<_ProjectCard> createState() => _ProjectCardState();
}

class _ProjectCardState extends State<_ProjectCard> {
  late final TextEditingController _name;
  late final TextEditingController _role;
  late final TextEditingController _desc;
  late final TextEditingController _url;
  late final TextEditingController _from;
  late final TextEditingController _to;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: widget.project.name);
    _role = TextEditingController(text: widget.project.role ?? '');
    _desc = TextEditingController(text: widget.project.description ?? '');
    _url = TextEditingController(text: widget.project.showcaseUrl ?? '');
    _from = TextEditingController(text: widget.project.startedAt ?? '');
    _to = TextEditingController(text: widget.project.endedAt ?? '');
  }

  @override
  void dispose() {
    _name.dispose();
    _role.dispose();
    _desc.dispose();
    _url.dispose();
    _from.dispose();
    _to.dispose();
    super.dispose();
  }

  CandidateProject _snapshot({List<String>? skills}) => CandidateProject(
        name: _name.text.trim(),
        role: _role.text.trim().isEmpty ? null : _role.text.trim(),
        description: _desc.text.trim().isEmpty ? null : _desc.text.trim(),
        showcaseUrl: _url.text.trim().isEmpty ? null : _url.text.trim(),
        startedAt: _from.text.trim().isEmpty ? null : _from.text.trim(),
        endedAt: _to.text.trim().isEmpty ? null : _to.text.trim(),
        skills: skills ?? widget.project.skills,
      );

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF09090B) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.10) : const Color(0xFFE4E4E7)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Icon(Icons.rocket_launch_rounded, size: 16, color: Color(0xFFEA580C)),
              const SizedBox(width: 6),
              const Expanded(
                child: Text('Project', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: Color(0xFF3F3F46))),
              ),
              IconButton(
                onPressed: widget.onRemove,
                icon: const Icon(Icons.close_rounded, size: 16, color: Color(0xFFE11D48)),
                visualDensity: VisualDensity.compact,
                tooltip: 'Remove project',
              ),
            ],
          ),
          _field(_name, 'Project name', isDark, onChanged: (_) => widget.onChange(_snapshot())),
          const SizedBox(height: 8),
          _field(_role, 'Your role (optional)', isDark, onChanged: (_) => widget.onChange(_snapshot())),
          const SizedBox(height: 8),
          _field(_desc, 'What it does (optional)', isDark, maxLines: 3, onChanged: (_) => widget.onChange(_snapshot())),
          const SizedBox(height: 8),
          _field(_url, 'Showcase URL (optional)', isDark, keyboardType: TextInputType.url, onChanged: (_) => widget.onChange(_snapshot())),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(child: _field(_from, 'Start (YYYY-MM)', isDark, onChanged: (_) => widget.onChange(_snapshot()))),
              const SizedBox(width: 8),
              Expanded(child: _field(_to, 'End (YYYY-MM)', isDark, onChanged: (_) => widget.onChange(_snapshot()))),
            ],
          ),
          const SizedBox(height: 8),
          const Text('Skills used', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF3F3F46))),
          const SizedBox(height: 6),
          ChipInput(
            value: widget.project.skills,
            onChange: (arr) => widget.onChange(_snapshot(skills: arr)),
            max: 8,
            placeholder: 'e.g. Flutter, Firebase',
          ),
        ],
      ),
    );
  }

  Widget _field(TextEditingController c, String label, bool isDark,
      {int maxLines = 1, TextInputType? keyboardType, ValueChanged<String>? onChanged}) {
    return TextField(
      controller: c,
      maxLines: maxLines,
      keyboardType: keyboardType,
      onChanged: onChanged,
      style: TextStyle(fontSize: 13, color: isDark ? Colors.white : const Color(0xFF09090B)),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(
          fontSize: 12,
          color: isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A),
        ),
        isDense: true,
        filled: true,
        fillColor: isDark ? const Color(0xFF18181B) : const Color(0xFFFAFAFA),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.10) : const Color(0xFFE4E4E7)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.10) : const Color(0xFFE4E4E7)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFF97316), width: 1.4),
        ),
      ),
    );
  }
}
