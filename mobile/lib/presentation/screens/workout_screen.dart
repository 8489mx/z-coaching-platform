import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class WorkoutScreen extends StatefulWidget {
  final Map<String, dynamic>? program;

  const WorkoutScreen({super.key, required this.program});

  @override
  State<WorkoutScreen> createState() => _WorkoutScreenState();
}

class _WorkoutScreenState extends State<WorkoutScreen> {
  int _selectedSessionIndex = 0;
  Timer? _restTimer;
  int _restSecondsRemaining = 0;

  void _startRestTimer(int seconds) {
    _restTimer?.cancel();
    setState(() => _restSecondsRemaining = seconds);
    _restTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_restSecondsRemaining > 0) {
        setState(() => _restSecondsRemaining--);
      } else {
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _restTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final sessions = widget.program?['training_program']?['weeks']?[0]?['sessions'] as List? ?? [];
    if (sessions.isEmpty) {
      return const Center(child: Text('لا توجد تمارين مسجلة'));
    }

    final activeSession = sessions[_selectedSessionIndex];
    final exercises = activeSession['exercises'] as List? ?? [];

    return Scaffold(
      body: Column(
        children: [
          // Session Selector
          Container(
            height: 60,
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: sessions.length,
              itemBuilder: (context, index) {
                final isSelected = _selectedSessionIndex == index;
                final sess = sessions[index];
                return Padding(
                  padding: const EdgeInsets.only(left: 8.0),
                  child: ChoiceChip(
                    label: Text(sess['session_name'] ?? 'تمرين ${index + 1}'),
                    selected: isSelected,
                    onSelected: (val) => setState(() => _selectedSessionIndex = index),
                    selectedColor: AppTheme.primary,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : AppTheme.textDark,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                );
              },
            ),
          ),

          // Rest Timer Floating Bar (if active)
          if (_restSecondsRemaining > 0)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: AppTheme.primaryDark,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.timer, color: Colors.white),
                      const SizedBox(width: 8),
                      Text(
                        'وقت الراحة المتبقي: $_restSecondsRemaining ثانية',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white, size: 18),
                    onPressed: () => setState(() => _restSecondsRemaining = 0),
                  ),
                ],
              ),
            ),

          // Exercise List
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: exercises.length,
              itemBuilder: (context, index) {
                final ex = exercises[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Exercise Name
                        Text(
                          ex['name_en'] ?? 'Exercise',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textDark,
                          ),
                        ),
                        if (ex['name_ar'] != null)
                          Text(
                            ex['name_ar'],
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppTheme.textMuted,
                            ),
                          ),
                        const SizedBox(height: 12),

                        // Prescription Pills
                        Row(
                          children: [
                            _buildPill('المجموعات', '${ex['sets'] ?? 3}'),
                            const SizedBox(width: 8),
                            _buildPill('التكرارات', '${ex['reps'] ?? 10}'),
                            const SizedBox(width: 8),
                            _buildPill('RIR', '${ex['rir'] ?? 2}'),
                            const Spacer(),
                            ElevatedButton.icon(
                              icon: const Icon(Icons.timer_outlined, size: 16),
                              label: Text('${ex['rest_seconds'] ?? 90} ث'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFE0F2FE),
                                foregroundColor: AppTheme.primary,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                              onPressed: () => _startRestTimer(ex['rest_seconds'] ?? 90),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPill(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Text('$label: ', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textDark)),
        ],
      ),
    );
  }
}
