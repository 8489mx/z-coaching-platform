import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/storage/local_storage.dart';
import '../models/workout_models.dart';
import '../services/workout_service.dart';

/// شاشة التدريب الميداني وتنفيذ الجلسة اليومية (Workout Screen)
/// تصميم احترافي فاخر مطابق للرؤية البصرية المرجعية وهوية كريم زكريا الرسمية
class WorkoutScreen extends StatefulWidget {
  final LocalStorage storage;
  const WorkoutScreen({super.key, required this.storage});

  @override
  State<WorkoutScreen> createState() => _WorkoutScreenState();
}

class _WorkoutScreenState extends State<WorkoutScreen> {
  late final WorkoutService _workoutService;

  List<WorkoutSession> _sessions = [];
  Map<String, dynamic>? _cardio;
  Map<String, dynamic>? _readinessGuidance;
  int _selectedSessionIndex = 0;
  String _selectedCategory = 'ALL'; // 'ALL' | 'RESISTANCE' | 'CARDIO' | 'MOBILITY'

  // حالات فتح وقفل الأقسام والتكنيك
  bool _isWarmupOpen = false;
  bool _isCardioOpen = false;
  bool _isStretchingOpen = false;
  final Map<String, bool> _expandedTechnique = {};

  // إدارة الحفظ التلقائي الفوري (Debounced Auto-Save)
  Timer? _autoSaveDebounceTimer;
  String _autoSaveStatus = 'جاهز'; // 'جاهز' | 'جاري الحفظ...' | 'تم الحفظ' | 'محفوظ محلياً'

  // حالة الأمان السريري والقفل الطبي (P0 Clinical Safety)
  bool _isClinicalLocked = false;
  String? _clinicalDirective;

  @override
  void initState() {
    super.initState();
    _workoutService = WorkoutService(widget.storage);
    _loadWorkoutSessions();
  }

  @override
  void dispose() {
    _autoSaveDebounceTimer?.cancel();
    super.dispose();
  }

  void _loadWorkoutSessions() {
    final clientData = widget.storage.getClientData();
    final userId = clientData?['client_code']?.toString() ?? clientData?['id']?.toString() ?? 'client';
    final cached = widget.storage.getCachedActiveProgram();

    // فحص القفل السريري من الذاكرة المحلية أو من كاش الخطة النشطة
    final localLock = widget.storage.getClientClinicalLockout(userId);
    final programLock = cached?['clinical_lockout'] is Map && cached!['clinical_lockout']['active'] == true;

    if (localLock != null || programLock) {
      _isClinicalLocked = true;
      _clinicalDirective = localLock?['directive']?.toString() ??
          (cached?['clinical_lockout'] is Map ? cached!['clinical_lockout']['emergency_directive']?.toString() : null) ??
          'تم إيقاف النشاط التدريبي فوراً لدواعي السلامة السريرية والوقاية القلبية.';
    } else {
      _isClinicalLocked = false;
      _clinicalDirective = null;
    }

    final clientView = cached?['client_view'] as Map<String, dynamic>?;
    if (clientView != null && clientView['readiness_guidance_ar'] is Map) {
      _readinessGuidance = Map<String, dynamic>.from(clientView['readiness_guidance_ar'] as Map);
    }
    if (clientView != null && clientView['cardio'] is Map) {
      _cardio = Map<String, dynamic>.from(clientView['cardio'] as Map);
    } else if (cached?['cardio'] is Map) {
      _cardio = Map<String, dynamic>.from(cached!['cardio'] as Map);
    }
    final loaded = _workoutService.getSessionsFromProgram(cached);
    _sessions = loaded;
    setState(() {});
  }

  /// تشغيل الحفظ التلقائي الفوري بمجرد تعديل أي حقل
  void _triggerAutoSave() {
    if (_sessions.isEmpty || _isClinicalLocked) return;
    setState(() {
      _autoSaveStatus = 'جاري الحفظ...';
    });

    _autoSaveDebounceTimer?.cancel();
    _autoSaveDebounceTimer = Timer(const Duration(milliseconds: 700), () async {
      final currentSession = _sessions[_selectedSessionIndex];
      final clientData = widget.storage.getClientData();
      final userId = clientData?['client_code']?.toString() ?? clientData?['id']?.toString() ?? 'client';

      final result = await _workoutService.submitWorkoutLog(
        userId: userId,
        sessionTitle: currentSession.dayName,
        exercises: currentSession.exercises,
      );

      if (mounted) {
        setState(() {
          if (result.isClinicalLockout) {
            _isClinicalLocked = true;
            _clinicalDirective = result.emergencyDirective ?? 'تم إيقاف التدريب مؤقتاً لدواعي السلامة السريرية.';
            _autoSaveStatus = 'مرفوض: قفل طبي سارٍ';
          } else if (result.isSuccess) {
            _autoSaveStatus = 'تم الحفظ';
          } else if (result.isOfflineQueued) {
            _autoSaveStatus = 'محفوظ محلياً';
          } else {
            _autoSaveStatus = 'فشل الحفظ';
          }
        });
      }
    });
  }

  Widget _buildClinicalAlertCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF87171), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFEF4444).withOpacity(0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.health_and_safety_outlined,
                  color: Color(0xFFDC2626),
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'تنبيه سريري عاجل',
                      style: TextStyle(
                        fontFamily: 'Alexandria',
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF991B1B),
                      ),
                    ),
                    Text(
                      'تم إيقاف التدريب مؤقتاً لدواعي السلامة',
                      style: TextStyle(
                        fontFamily: 'Alexandria',
                        fontSize: 12,
                        color: Color(0xFFB91C1C),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            _clinicalDirective ??
                'تم رصد أعراض ألم بالصدر أو إغماء أثناء الجهد البدني. يجب إيقاف أي مجهود تدريبي فوراً والرجوع للطبيب المعالج.',
            style: const TextStyle(
              fontFamily: 'Alexandria',
              fontSize: 13,
              height: 1.5,
              color: Color(0xFF7F1D1D),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFFECACA)),
            ),
            child: const Text(
              'إذا كانت لديك أعراض حادة ومستمرة أو ألم ممتد للذراع أو الفك، توجه لأقرب مستشفى أو اتصل فوراً بالإسعاف (123 في مصر / 997 في السعودية / 911 دولياً).',
              style: TextStyle(
                fontFamily: 'Alexandria',
                fontSize: 11,
                height: 1.4,
                color: Color(0xFF991B1B),
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('تواصل مع الكوتش عبر الواتساب لطلب المراجعة الطبية واستيفاء شروط الاستئناف.'),
                ),
              );
            },
            icon: const Icon(Icons.support_agent_outlined, size: 18),
            label: const Text(
              'التواصل مع الكوتش للمراجعة الطبية',
              style: TextStyle(fontFamily: 'Alexandria', fontSize: 12, fontWeight: FontWeight.bold),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isClinicalLocked) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('التمارين'),
        ),
        body: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: _buildClinicalAlertCard(),
          ),
        ),
      );
    }

    if (_sessions.isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('التمارين'),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.fitness_center_outlined, size: 48, color: AppColors.textMuted),
                const SizedBox(height: 16),
                const Text(
                  'لا توجد جلسات تدريبية مسجلة حالياً.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text(
                  'يرجى التواصل مع المدرب لاعتماد خطتك التدريبية.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _loadWorkoutSessions,
                  child: const Text('إعادة المحاولة'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final currentSession = _sessions[_selectedSessionIndex];
    final clientData = widget.storage.getClientData();
    final isMax = clientData?['tier']?.toString().toUpperCase().contains('MAX') == true;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          children: [
            // ============================================================
            // 1. TOP EXECUTIVE HEADER (مطابق لترويسة الصورة المرجعية)
            // ============================================================
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'التمارين',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.5,
                        fontFamily: 'Alexandria',
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      currentSession.dayName,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textMuted,
                        fontFamily: 'Alexandria',
                      ),
                    ),
                  ],
                ),

                Row(
                  children: [
                    // شارة الباقة الرسمية الفاخرة (MAX أو ELITE)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(
                        color: isMax ? AppColors.maxTint : AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(9999),
                        border: Border.all(
                          color: isMax ? AppColors.maxGold : AppColors.primary,
                          width: 1,
                        ),
                      ),
                      child: Text(
                        isMax ? 'MAX' : 'ELITE',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: isMax ? AppColors.maxPrimary : AppColors.primaryDeep,
                          fontFamily: 'Alexandria',
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),

                    // مؤشر الحفظ والمزامنة التلقائية الهادئ
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                      decoration: BoxDecoration(
                        color: _autoSaveStatus == 'تم الحفظ'
                            ? const Color(0xFFECFDF5)
                            : (_autoSaveStatus == 'جاري الحفظ...' ? const Color(0xFFF0F9FF) : AppColors.surface),
                        borderRadius: BorderRadius.circular(9999),
                        border: Border.all(
                          color: _autoSaveStatus == 'تم الحفظ'
                              ? const Color(0xFFA7F3D0)
                              : (_autoSaveStatus == 'جاري الحفظ...' ? const Color(0xFFBAE6FD) : AppColors.border),
                          width: 0.8,
                        ),
                        boxShadow: AppColors.softCardShadow,
                      ),
                      child: Text(
                        _autoSaveStatus,
                        style: TextStyle(
                          color: _autoSaveStatus == 'تم الحفظ'
                              ? const Color(0xFF059669)
                              : (_autoSaveStatus == 'جاري الحفظ...' ? AppColors.primaryDeep : AppColors.textMuted),
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Alexandria',
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),

            const SizedBox(height: 16),

            // ============================================================
            // 2. SESSIONS SELECTOR (شريط الجلسات والأيام الكبسولي الناعم)
            // ============================================================
            if (_sessions.length > 1) ...[
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: List.generate(_sessions.length, (idx) {
                    final isSel = idx == _selectedSessionIndex;
                    return Padding(
                      padding: const EdgeInsets.only(left: 8),
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedSessionIndex = idx),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                          decoration: BoxDecoration(
                            color: isSel ? AppColors.primary : AppColors.surface,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isSel ? AppColors.primary : AppColors.border,
                              width: 1,
                            ),
                            boxShadow: isSel ? [
                              BoxShadow(
                                color: AppColors.primary.withAlpha(50),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              )
                            ] : AppColors.softCardShadow,
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'جلسة ${idx + 1}',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: isSel ? Colors.white : AppColors.textPrimary,
                                  fontFamily: 'Alexandria',
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${_sessions[idx].exercises.length} تمارين',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: isSel ? Colors.white70 : AppColors.textMuted,
                                  fontFamily: 'Alexandria',
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // ============================================================
            // 3. SESSION HERO SUMMARY CARD (بطاقة اليوم التدريبي المرجعية)
            // ============================================================
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: const Color(0xFFF0F9FF),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: const Color(0xFFBAE6FD).withAlpha(120), width: 1),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(10),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        )
                      ],
                    ),
                    child: const Icon(Icons.fitness_center_rounded, color: AppColors.primaryDeep, size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          currentSession.dayName,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                            fontFamily: 'Alexandria',
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          'إجمالي ${currentSession.exercises.length} تمارين معتمدة للجلسة',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                            fontFamily: 'Alexandria',
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFBAE6FD), width: 2),
                    ),
                    child: Center(
                      child: Text(
                        '${currentSession.completedExercisesCount}/${currentSession.exercises.length}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryDeep,
                          fontFamily: 'Alexandria',
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // ============================================================
            // 4. CATEGORY FILTER CHIPS (شريط الفئات الكبسولي الناعم)
            // ============================================================
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildCategoryChip('ALL', 'كل التمارين (${currentSession.exercises.length})'),
                  _buildCategoryChip('RESISTANCE', 'تمارين المقاومة (${currentSession.exercises.length})'),
                  if (_cardio != null)
                    _buildCategoryChip('CARDIO', 'النشاط الهوائي'),
                  _buildCategoryChip('MOBILITY', 'التهيئة والإطالات'),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // ============================================================
            // 5. WARMUP SECTION (أكورديون الإحماء والتهيئة)
            // ============================================================
            if (_selectedCategory == 'ALL' || _selectedCategory == 'MOBILITY') ...[
              _buildMinimalAccordion(
                title: 'التهيئة الحركية والإحماء',
                subtitle: '5 دقائق إحماء عام لرفع حرارة المفاصل والأوتار',
                icon: Icons.accessibility_new_rounded,
                isOpen: _isWarmupOpen,
                onToggle: () => setState(() => _isWarmupOpen = !_isWarmupOpen),
                child: Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: Text(
                    _readinessGuidance?['general_warmup_ar']?.toString() ??
                        currentSession.warmupProtocol,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.5, fontFamily: 'Alexandria'),
                  ),
                ),
              ),
              const SizedBox(height: 14),
            ],

            // ============================================================
            // 6. MAIN RESISTANCE EXERCISES (كروت المقاومة المفتوحة الفاخرة)
            // ============================================================
            if (_selectedCategory == 'ALL' || _selectedCategory == 'RESISTANCE') ...[
              ...currentSession.exercises.asMap().entries.map((entry) {
                final index = entry.key;
                final exercise = entry.value;
                final isTechniqueOpen = _expandedTechnique[exercise.id] ?? false;

                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: AppColors.border, width: 0.8),
                    boxShadow: AppColors.softCardShadow,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header Row: Thumbnail + Exercise Name + Completion Circle
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Small Thumbnail (صورة مصغرة مربعة أنيقة إذا توفرت)
                          if (exercise.imageUrl != null && exercise.imageUrl!.isNotEmpty)
                            Container(
                              width: 60,
                              height: 60,
                              margin: const EdgeInsets.only(left: 12),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: AppColors.borderLight, width: 1),
                                image: DecorationImage(
                                  image: NetworkImage(exercise.imageUrl!),
                                  fit: BoxFit.cover,
                                ),
                              ),
                            )
                          else
                            Container(
                              width: 44,
                              height: 44,
                              margin: const EdgeInsets.only(left: 12),
                              decoration: BoxDecoration(
                                color: AppColors.primaryLight,
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Center(
                                child: Text(
                                  '${index + 1}',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primaryDeep,
                                    fontFamily: 'Alexandria',
                                  ),
                                ),
                              ),
                            ),

                          // Exercise Titles (العربي والإنجليزي)
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  exercise.nameEn ?? exercise.name,
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.textPrimary,
                                    letterSpacing: -0.3,
                                    fontFamily: 'Alexandria',
                                  ),
                                ),
                                if (exercise.nameEn != null && exercise.name != exercise.nameEn) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    exercise.name,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textMuted,
                                      fontFamily: 'Alexandria',
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),

                          // Completion Check Circle
                          GestureDetector(
                            onTap: () {
                              setState(() {
                                exercise.isCompleted = !exercise.isCompleted;
                              });
                              _triggerAutoSave();
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 150),
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: exercise.isCompleted ? AppColors.success : AppColors.surfaceMuted,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: exercise.isCompleted ? AppColors.success : AppColors.border,
                                  width: 1.5,
                                ),
                              ),
                              child: Icon(
                                Icons.check,
                                size: 18,
                                color: exercise.isCompleted ? Colors.white : AppColors.textMuted,
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // 4-Column Prescription Grid (مطابق تماماً للشاشة الثانية بالصورة المرجعية)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildPrescriptionCol(
                              icon: Icons.layers_outlined,
                              val: '${exercise.targetSets}',
                              lbl: 'مجموعات',
                            ),
                            Container(width: 1, height: 26, color: AppColors.borderLight),
                            _buildPrescriptionCol(
                              icon: Icons.refresh_rounded,
                              val: exercise.targetReps,
                              lbl: 'عدات',
                            ),
                            Container(width: 1, height: 26, color: AppColors.borderLight),
                            _buildPrescriptionCol(
                              icon: Icons.show_chart_rounded,
                              val: exercise.targetRir != null ? '${exercise.targetRir}' : 'مناسب',
                              lbl: 'الشدة',
                            ),
                            Container(width: 1, height: 26, color: AppColors.borderLight),
                            _buildPrescriptionCol(
                              icon: Icons.timer_outlined,
                              val: '${exercise.restSeconds}ث',
                              lbl: 'راحة',
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 14),

                      // Quick Guidance Accordion (تعليمات سريعة قابلة للمعاينة الهادئة)
                      GestureDetector(
                        onTap: () {
                          setState(() {
                            _expandedTechnique[exercise.id] = !isTechniqueOpen;
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border, width: 0.8),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.lightbulb_outline, size: 16, color: Color(0xFFD97706)),
                                  SizedBox(width: 8),
                                  Text(
                                    'تعليمات سريعة وتكنيك',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.textPrimary,
                                      fontFamily: 'Alexandria',
                                    ),
                                  ),
                                ],
                              ),
                              Icon(
                                isTechniqueOpen ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                                size: 18,
                                color: AppColors.textMuted,
                              ),
                            ],
                          ),
                        ),
                      ),

                      if (isTechniqueOpen) ...[
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFFBEB),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFFDE68A), width: 0.8),
                          ),
                          child: Text(
                            exercise.cue,
                            style: const TextStyle(
                              fontSize: 11,
                              color: Color(0xFF92400E),
                              height: 1.5,
                              fontFamily: 'Alexandria',
                            ),
                          ),
                        ),
                      ],

                      const SizedBox(height: 16),

                      // Performance Logging Section (تسجيل الأداء الميداني الذكي — Stepper Controls)
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'تسجيل الأداء',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.textPrimary,
                                    fontFamily: 'Alexandria',
                                  ),
                                ),
                                GestureDetector(
                                  onTap: () {
                                    exercise.loggedWeight = exercise.loggedWeight ?? 40.0;
                                    exercise.loggedLastSetReps = exercise.loggedLastSetReps ?? 10;
                                    setState(() {});
                                    _triggerAutoSave();
                                  },
                                  child: const Text(
                                    'زي آخر مرة',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.primaryDeep,
                                      fontFamily: 'Alexandria',
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),

                            // Stepper Controls (الوزن والعدات)
                            Row(
                              children: [
                                // Weight Stepper
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.center,
                                    children: [
                                      Text(
                                        widget.storage.getUnitPreferences()['exercise_weight_unit'] == 'lb' ? 'الوزن (باوند)' : 'الوزن (كجم)',
                                        style: const TextStyle(fontSize: 10, color: AppColors.textMuted, fontFamily: 'Alexandria'),
                                      ),
                                      const SizedBox(height: 6),
                                      _buildStepperControl(
                                        val: exercise.loggedWeight != null
                                            ? (widget.storage.getUnitPreferences()['exercise_weight_unit'] == 'lb'
                                                ? (exercise.loggedWeight! * 2.2046226218).toStringAsFixed(1)
                                                : exercise.loggedWeight!.toStringAsFixed(exercise.loggedWeight! % 1 == 0 ? 0 : 1))
                                            : '--',
                                        onMinus: () {
                                          final isLb = widget.storage.getUnitPreferences()['exercise_weight_unit'] == 'lb';
                                          final currentKg = exercise.loggedWeight ?? 40.0;
                                          if (isLb) {
                                            final currentLb = currentKg * 2.2046226218;
                                            if (currentLb > 5.0) {
                                              exercise.loggedWeight = (currentLb - 5.0) / 2.2046226218;
                                              setState(() {});
                                              _triggerAutoSave();
                                            }
                                          } else {
                                            if (currentKg > 1.25) {
                                              exercise.loggedWeight = currentKg - 2.5;
                                              setState(() {});
                                              _triggerAutoSave();
                                            }
                                          }
                                        },
                                        onPlus: () {
                                          final isLb = widget.storage.getUnitPreferences()['exercise_weight_unit'] == 'lb';
                                          final currentKg = exercise.loggedWeight ?? 40.0;
                                          if (isLb) {
                                            final currentLb = currentKg * 2.2046226218;
                                            exercise.loggedWeight = (currentLb + 5.0) / 2.2046226218;
                                          } else {
                                            exercise.loggedWeight = currentKg + 2.5;
                                          }
                                          setState(() {});
                                          _triggerAutoSave();
                                        },
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 12),

                                // Reps Stepper
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.center,
                                    children: [
                                      const Text(
                                        'العدات',
                                        style: TextStyle(fontSize: 10, color: AppColors.textMuted, fontFamily: 'Alexandria'),
                                      ),
                                      const SizedBox(height: 6),
                                      _buildStepperControl(
                                        val: exercise.loggedLastSetReps != null ? '${exercise.loggedLastSetReps}' : '--',
                                        onMinus: () {
                                          final current = exercise.loggedLastSetReps ?? 10;
                                          if (current > 1) {
                                            exercise.loggedLastSetReps = current - 1;
                                            setState(() {});
                                            _triggerAutoSave();
                                          }
                                        },
                                        onPlus: () {
                                          final current = exercise.loggedLastSetReps ?? 10;
                                          exercise.loggedLastSetReps = current + 1;
                                          setState(() {});
                                          _triggerAutoSave();
                                        },
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 14),

                            // Effort Evaluation Pills (تقييم المجهود: صعب / مناسب / سهل)
                            const Text(
                              'تقييم المجهود',
                              style: TextStyle(fontSize: 10, color: AppColors.textMuted, fontFamily: 'Alexandria'),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Expanded(child: _buildEffortPill('صعب', 'HARD', exercise)),
                                const SizedBox(width: 8),
                                Expanded(child: _buildEffortPill('مناسب', 'OK', exercise)),
                                const SizedBox(width: 8),
                                Expanded(child: _buildEffortPill('سهل', 'EASY', exercise)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],

            // ============================================================
            // 7. CARDIO SECTION (النشاط الهوائي)
            // ============================================================
            if ((_selectedCategory == 'ALL' || _selectedCategory == 'CARDIO') && _cardio != null) ...[
              _buildMinimalAccordion(
                title: 'بروتوكول النشاط الهوائي (الكارديو)',
                subtitle: '${_cardio!['duration_minutes'] ?? 20} دقيقة نشاط معتدل',
                icon: Icons.directions_run_rounded,
                isOpen: _isCardioOpen,
                onToggle: () => setState(() => _isCardioOpen = !_isCardioOpen),
                child: Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildPrescriptionCol(
                              icon: Icons.access_time_rounded,
                              val: '${_cardio!['duration_minutes'] ?? 20} دقيقة',
                              lbl: 'المدة',
                            ),
                            _buildPrescriptionCol(
                              icon: Icons.favorite_rounded,
                              iconColor: const Color(0xFFFF2D55),
                              val: '${_cardio!['target_hr_range'] ?? '125–135'}',
                              lbl: 'bpm',
                            ),
                            _buildPrescriptionCol(
                              icon: Icons.trending_up_rounded,
                              val: '${_cardio!['incline_percent'] ?? '4–6%'}',
                              lbl: 'انحدار',
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        _cardio!['talk_test_cue_ar']?.toString() ??
                            'نشاط هوائي منتظم بسرعة معتدلة مع ضبط التنفس واستعادة الطاقة.',
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.5, fontFamily: 'Alexandria'),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
            ],

            // ============================================================
            // 8. STRETCHING SECTION (الإطالات والتبريد)
            // ============================================================
            if (_selectedCategory == 'ALL' || _selectedCategory == 'MOBILITY') ...[
              _buildMinimalAccordion(
                title: 'الإطالات وتبريد الجلسة',
                subtitle: '5 دقائق إطالات ثابتة للمفاصل والعضلات الرئيسية',
                icon: Icons.self_improvement_rounded,
                isOpen: _isStretchingOpen,
                onToggle: () => setState(() => _isStretchingOpen = !_isStretchingOpen),
                child: const Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: Text(
                    'إطالات ثابتة للعضلات المستهدفة والمفاصل للمساعدة على تهدئة الجهاز العصبي وتقليل التوتر العضلي.',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.5, fontFamily: 'Alexandria'),
                  ),
                ),
              ),
            const SizedBox(height: 16),

            // تنبيه استرشادي طبي وإخلاء مسؤولية
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.borderLight),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline, size: 16, color: AppColors.textMuted),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'تنبيه استرشادي: البرامج التدريبية والأوزان المقترحة مخصصة للياقة البدنية، وليست بديلاً عن الاستشارة أو التأهيل الطبي. يُرجى مراجعة طبيبك المختص قبل أداء التمارين عند وجود أي إصابات أو عوارض صحية.',
                      style: TextStyle(color: AppColors.textMuted, fontSize: 11, height: 1.45, fontFamily: 'Alexandria'),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryChip(String id, String label) {
    final isSel = _selectedCategory == id;
    return Padding(
      padding: const EdgeInsets.only(left: 8),
      child: GestureDetector(
        onTap: () => setState(() => _selectedCategory = id),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: isSel ? AppColors.primary : AppColors.surface,
            borderRadius: BorderRadius.circular(9999),
            border: Border.all(
              color: isSel ? AppColors.primary : AppColors.border,
              width: 1,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSel ? FontWeight.bold : FontWeight.w600,
              color: isSel ? Colors.white : AppColors.textSecondary,
              fontFamily: 'Alexandria',
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPrescriptionCol({
    required IconData icon,
    required String val,
    required String lbl,
    Color? iconColor,
  }) {
    return Column(
      children: [
        Icon(icon, size: 16, color: iconColor ?? AppColors.textMuted),
        const SizedBox(height: 4),
        Text(
          val,
          textDirection: TextDirection.ltr,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
            fontFamily: 'Alexandria',
          ),
        ),
        const SizedBox(height: 2),
        Text(
          lbl,
          style: const TextStyle(
            fontSize: 10,
            color: AppColors.textMuted,
            fontFamily: 'Alexandria',
          ),
        ),
      ],
    );
  }

  Widget _buildStepperControl({
    required String val,
    required VoidCallback onMinus,
    required VoidCallback onPlus,
  }) {
    return Container(
      height: 42,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border, width: 1),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(Icons.remove, size: 16, color: AppColors.textMuted),
            onPressed: onMinus,
            splashRadius: 18,
          ),
          Text(
            val,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
              fontFamily: 'Alexandria',
            ),
          ),
          IconButton(
            icon: const Icon(Icons.add, size: 16, color: AppColors.primaryDeep),
            onPressed: onPlus,
            splashRadius: 18,
          ),
        ],
      ),
    );
  }

  Widget _buildEffortPill(String label, String value, Exercise exercise) {
    final isSelected = exercise.loggedEffort == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          exercise.loggedEffort = value;
        });
        _triggerAutoSave();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 9),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFF0F7FF) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              color: isSelected ? AppColors.primaryDeep : AppColors.textSecondary,
              fontFamily: 'Alexandria',
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMinimalAccordion({
    required String title,
    required String subtitle,
    required IconData icon,
    required bool isOpen,
    required VoidCallback onToggle,
    required Widget child,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border, width: 0.8),
        boxShadow: AppColors.softCardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: onToggle,
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceMuted,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, size: 18, color: AppColors.primaryDeep),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                          fontFamily: 'Alexandria',
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: const TextStyle(fontSize: 11, color: AppColors.textMuted, fontFamily: 'Alexandria'),
                      ),
                    ],
                  ),
                ),
                Icon(
                  isOpen ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                  size: 20,
                  color: AppColors.textMuted,
                ),
              ],
            ),
          ),
          if (isOpen) child,
        ],
      ),
    );
  }
}
