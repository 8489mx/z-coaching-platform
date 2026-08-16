import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/services/api_service.dart';

class CheckinScreen extends StatefulWidget {
  final String clientCode;
  final VoidCallback onSubmitted;

  const CheckinScreen({
    super.key,
    required this.clientCode,
    required this.onSubmitted,
  });

  @override
  State<CheckinScreen> createState() => _CheckinScreenState();
}

class _CheckinScreenState extends State<CheckinScreen> {
  final _formKey = GlobalKey<FormState>();
  final List<TextEditingController> _weightControllers = List.generate(
    7,
    (index) => TextEditingController(text: (85.0 - (index * 0.1)).toStringAsFixed(1)),
  );
  final _waistController = TextEditingController(text: '88.5');
  double _adherence = 95.0;
  int _workouts = 4;
  bool _submitting = false;

  Future<void> _submitCheckin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);
    try {
      final weights = _weightControllers.map((c) => double.tryParse(c.text) ?? 85.0).toList();
      final payload = {
        'client_code': widget.clientCode,
        'week_number': 1,
        'daily_weights_kg': weights,
        'previous_average_weight_kg': 85.5,
        'waist_circumference_cm': double.tryParse(_waistController.text) ?? 88.5,
        'nutrition_adherence_percent': _adherence.toInt(),
        'workouts_completed': _workouts,
        'workouts_scheduled': 4,
        'biofeedback': {
          'hunger_level': 2,
          'energy_in_gym': 4,
          'sleep_quality': 4,
          'stress_level': 2,
        },
      };

      await ApiService().submitCheckin(payload);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ تم إرسال المتابعة الأسبوعية بنجاح إلى الكابتن للمراجعة!'),
            backgroundColor: AppTheme.success,
          ),
        );
        widget.onSubmitted();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('خطأ: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: AppTheme.danger,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header Card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        '📋 المتابعة الأسبوعية (Weekly Check-in)',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'سجل أوزانك اليومية ومحيط الخصر لمراجعة وتكييف خطتك للأسبوع القادم',
                        style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // 7-Days Weights
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'أوزان الأيام الـ 7 على الريق (كجم)',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: List.generate(7, (index) {
                          return SizedBox(
                            width: (MediaQuery.of(context).size.width - 80) / 4,
                            child: TextFormField(
                              controller: _weightControllers[index],
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              textAlign: TextAlign.center,
                              decoration: InputDecoration(
                                labelText: 'يوم ${index + 1}',
                                labelStyle: const TextStyle(fontSize: 11),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                              ),
                            ),
                          );
                        }),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Waist & Adherence
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextFormField(
                        controller: _waistController,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: InputDecoration(
                          labelText: 'محيط الخصر (سم)',
                          prefixIcon: const Icon(Icons.straighten),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'نسبة الالتزام بالدايت: ${_adherence.toInt()}%',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Slider(
                        value: _adherence,
                        min: 50,
                        max: 100,
                        divisions: 10,
                        activeColor: AppTheme.primary,
                        onChanged: (val) => setState(() => _adherence = val),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),

              ElevatedButton(
                onPressed: _submitting ? null : _submitCheckin,
                child: _submitting
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                      )
                    : const Text('إرسال المتابعة الأسبوعية للكابتن 🚀'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
