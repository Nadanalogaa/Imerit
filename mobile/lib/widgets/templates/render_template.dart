import 'package:flutter/material.dart';
import 'template_data.dart';
import 'classic_template.dart';
import 'modern_template.dart';
import 'creative_template.dart';
import 'corporate_template.dart';
import 'tech_mono_template.dart';

class RenderTemplate extends StatelessWidget {
  const RenderTemplate({super.key, required this.id, required this.data});
  final String id;
  final TemplateData data;

  @override
  Widget build(BuildContext context) {
    switch (id) {
      case 'classic':
        return ClassicTemplate(data: data);
      case 'modern':
        return ModernTemplate(data: data);
      case 'creative':
        return CreativeTemplate(data: data);
      case 'corporate':
        return CorporateTemplate(data: data);
      case 'tech_mono':
        return TechMonoTemplate(data: data);
      default:
        return ModernTemplate(data: data);
    }
  }
}
