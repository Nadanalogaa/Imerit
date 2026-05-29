import 'dart:convert';
import 'package:flutter/material.dart';
import '../../storage/storage.dart';

class SuggestionForm extends StatefulWidget {
  const SuggestionForm({super.key});

  @override
  State<SuggestionForm> createState() => _SuggestionFormState();
}

class _SuggestionFormState extends State<SuggestionForm> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _message = TextEditingController();
  bool _sent = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _message.dispose();
    super.dispose();
  }

  void _submit() {
    if (_name.text.trim().isEmpty || _message.text.trim().isEmpty) return;
    final raw = Storage.instance.getString('itr.suggestions');
    final List<dynamic> list = raw == null ? [] : (jsonDecode(raw) as List<dynamic>);
    list.insert(0, {
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'name': _name.text,
      'email': _email.text,
      'message': _message.text,
      'createdAt': DateTime.now().toIso8601String(),
    });
    Storage.instance.setString('itr.suggestions', jsonEncode(list));
    setState(() {
      _sent = true;
      _name.clear();
      _email.clear();
      _message.clear();
    });
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) setState(() => _sent = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: Stack(
        children: [
          Positioned.fill(
            child: Stack(
              fit: StackFit.expand,
              children: [
                Image.asset('assets/images/background-02.jpg', fit: BoxFit.cover),
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        const Color(0xFF09090B).withValues(alpha: 0.85),
                        const Color(0xFF18181B).withValues(alpha: 0.92),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 40, 20, 40),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'HAVE A SUGGESTION?',
                  style: TextStyle(
                    fontSize: 11,
                    letterSpacing: 2,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFFFB923C),
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  "We're listening — tell us\nhow to make this better",
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    letterSpacing: -0.5,
                    height: 1.2,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  'Found a bug? Wish a feature existed? Drop us a note. Real humans read every message.',
                  style: TextStyle(
                    fontSize: 13.5,
                    height: 1.55,
                    color: Colors.white.withValues(alpha: 0.75),
                  ),
                ),
                const SizedBox(height: 16),
                _Tick('Suggestions help shape what we build next'),
                const SizedBox(height: 6),
                _Tick('No spam — your details stay with us'),
                const SizedBox(height: 6),
                _Tick('Available in Tamil and English'),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _GlassField(controller: _name, label: 'Your name', hint: 'e.g. Karthick S.'),
                      const SizedBox(height: 14),
                      _GlassField(controller: _email, label: 'Email (optional)', hint: 'you@example.com'),
                      const SizedBox(height: 14),
                      _GlassField(
                        controller: _message,
                        label: 'Your message',
                        hint: "Tell us what's on your mind...",
                        maxLines: 4,
                      ),
                      const SizedBox(height: 18),
                      ElevatedButton(
                        onPressed: _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: const Color(0xFF09090B),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('Send suggestion', style: TextStyle(fontWeight: FontWeight.w600)),
                            SizedBox(width: 6),
                            Icon(Icons.arrow_forward, size: 16),
                          ],
                        ),
                      ),
                      if (_sent) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF34D399).withValues(alpha: 0.15),
                            border: Border.all(
                              color: const Color(0xFF34D399).withValues(alpha: 0.4),
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            'Thank you! Your suggestion has been recorded.',
                            style: TextStyle(color: Color(0xFF6EE7B7), fontSize: 12),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Tick extends StatelessWidget {
  const _Tick(this.text);
  final String text;
  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(Icons.check_rounded, size: 16, color: Color(0xFF6EE7B7)),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 12.5,
              color: Colors.white.withValues(alpha: 0.8),
              height: 1.4,
            ),
          ),
        ),
      ],
    );
  }
}

class _GlassField extends StatelessWidget {
  const _GlassField({
    required this.controller,
    required this.label,
    required this.hint,
    this.maxLines = 1,
  });

  final TextEditingController controller;
  final String label;
  final String hint;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: Colors.white.withValues(alpha: 0.8),
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          maxLines: maxLines,
          style: const TextStyle(color: Colors.white, fontSize: 13.5),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 13),
            filled: true,
            fillColor: Colors.white.withValues(alpha: 0.06),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.4)),
            ),
          ),
        ),
      ],
    );
  }
}
