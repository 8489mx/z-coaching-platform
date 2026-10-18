import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';

/// عنصر تنقل داخل شريط العدسة الزجاجية السائلة
class LiquidGlassNavItem {
  final IconData icon;
  final String label;

  const LiquidGlassNavItem({
    required this.icon,
    required this.label,
  });
}

/// شريط التنقل السفلي العائم بنمط العدسة الزجاجية السائلة وانكسار الأيقونات
/// Liquid Glass Floating Bottom Navigation with Animated Refractive Selection Lens
///
/// المواصفات الهندسية:
/// 1. محاكاة انكسار زجاجي حقيقي (True Optical Refraction & Convex Magnification)
///    عبر Flutter Fragment Shader (Impeller) مع بديل رسومي أصلي متقدم (CustomPainter Fallback).
/// 2. تمدد اتجاهي سائل (Directional Liquid Squish & Stretch) يتبع مسار الحركة.
/// 3. استقرار نابضي مضبوط (Damped Spring Physics) بزمن 400ms (نطاق 350-450ms) دون ارتداد مفرط.
/// 4. تباين دقيق بين حالة الاستقرار (Resting Pill) وحالة السائل الزجاجي المتحرك (Moving Liquid Drop).
/// 5. حواف لامعة وظل زجاجي ناعم يطابق الفريمات التسعة للمرجع.
/// 6. دعم كامل لـ RTL والـ Safe Area و4 تبويبات حصرية.
class LiquidGlassNavBar extends StatefulWidget {
  final int currentIndex;
  final ValueChanged<int> onTabSelected;
  final List<LiquidGlassNavItem> items;
  final Duration animationDuration;
  final Color activeColor;
  final Color inactiveColor;

  const LiquidGlassNavBar({
    super.key,
    required this.currentIndex,
    required this.onTabSelected,
    required this.items,
    this.animationDuration = const Duration(milliseconds: 400),
    this.activeColor = const Color(0xFF0284C7),
    this.inactiveColor = const Color(0xFF475569),
  });

  @override
  State<LiquidGlassNavBar> createState() => _LiquidGlassNavBarState();
}

class _LiquidGlassNavBarState extends State<LiquidGlassNavBar>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  int _fromIndex = 0;
  int _toIndex = 0;

  ui.FragmentProgram? _fragmentProgram;
  ui.FragmentShader? _fragmentShader;
  bool _shaderLoaded = false;

  @override
  void initState() {
    super.initState();
    _fromIndex = widget.currentIndex;
    _toIndex = widget.currentIndex;

    _controller = AnimationController(
      vsync: this,
      duration: widget.animationDuration,
    );

    // منحنى نابض مضبوط (Snappy Critically-Damped Spring)
    // يعطي انطلاقاً سريعاً واستقراراً طبيعياً دون بطء أو ارتداد متذبذب
    _animation = CurvedAnimation(
      parent: _controller,
      curve: const _SnappySpringCurve(),
    );

    _controller.addListener(() {
      setState(() {});
    });

    _loadShader();
  }

  Future<void> _loadShader() async {
    try {
      final program = await ui.FragmentProgram.fromAsset(
        'shaders/liquid_glass_refraction.frag',
      );
      if (mounted) {
        setState(() {
          _fragmentProgram = program;
          _fragmentShader = program.fragmentShader();
          _shaderLoaded = true;
        });
      }
    } catch (_) {
      // عند تعذر تحميل الشادر (مثل Skia أو بيئة الاختبارات)، يعمل البديل الرسومي التوافقي تلقائياً
      _shaderLoaded = false;
    }
  }

  @override
  void didUpdateWidget(covariant LiquidGlassNavBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.currentIndex != widget.currentIndex) {
      _fromIndex = oldWidget.currentIndex;
      _toIndex = widget.currentIndex;
      _controller.forward(from: 0.0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _fragmentShader?.dispose();
    super.dispose();
  }

  void _handleTap(int index) {
    if (index == widget.currentIndex && !_controller.isAnimating) return;
    widget.onTabSelected(index);
  }

  @override
  Widget build(BuildContext context) {
    final isRtl = Directionality.of(context) == TextDirection.rtl;
    final count = widget.items.length;

    return SafeArea(
      top: false,
      left: false,
      right: false,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final totalWidth = constraints.maxWidth;
          final itemWidth = totalWidth / count;

          // حساب مركز التبويب الحالي والهدف مع مراعاة اتجاه RTL
          double getTabCenterX(int idx) {
            final mappedIdx = isRtl ? (count - 1 - idx) : idx;
            return mappedIdx * itemWidth + (itemWidth / 2);
          }

          final startCenterX = getTabCenterX(_fromIndex);
          final targetCenterX = getTabCenterX(_toIndex);

          final progress = _animation.value;
          final currentCenterX = ui.lerpDouble(startCenterX, targetCenterX, progress) ?? targetCenterX;

          final isMoving = _controller.isAnimating;
          final travelDistance = (targetCenterX - startCenterX).abs();

          // زاوية واتجاه الحركة (-1 لليسار، 1 لليمين)
          final directionSign = targetCenterX >= startCenterX ? 1.0 : -1.0;
          final stretchAngle = targetCenterX >= startCenterX ? 0.0 : math.pi;

          // تمدد اتجاهي ديناميكي (Anisotropic Squish & Stretch)
          // يبلغ ذروته عند 40% من مسار الرحلة ثم يتلاشى تدريجياً عند الاقتراب
          final animT = _controller.value.clamp(0.0, 1.0);
          final stretchFactor = math.sin(math.pi * math.pow(animT, 0.9));
          final maxStretch = math.min(travelDistance * 0.42, 48.0);
          final restingPillWidth = math.min(math.max(itemWidth - 8.0, 52.0), 72.0);
          final currentLensWidth = restingPillWidth + (maxStretch * stretchFactor);
          final currentLensHeight = 44.0;
          final currentLensRadius = currentLensWidth / 2;

          // تحديث معايير الشادر إن كان متاحاً
          if (_shaderLoaded && _fragmentShader != null) {
            _fragmentShader!.setFloat(0, totalWidth);            // uSize.x
            _fragmentShader!.setFloat(1, 64.0);                  // uSize.y
            _fragmentShader!.setFloat(2, currentCenterX);        // uLensCenter.x
            _fragmentShader!.setFloat(3, 32.0);                  // uLensCenter.y
            _fragmentShader!.setFloat(4, currentLensRadius);     // uLensRadius.x
            _fragmentShader!.setFloat(5, currentLensHeight / 2); // uLensRadius.y
            _fragmentShader!.setFloat(6, 0.065);                 // uRefraction
            _fragmentShader!.setFloat(7, 1.28);                  // uMagnification
            _fragmentShader!.setFloat(8, stretchAngle);          // uStretchAngle
            _fragmentShader!.setFloat(9, isMoving ? 1.0 : 0.0);   // uActivity
            _fragmentShader!.setFloat(10, directionSign);        // uDirection
          }

          return Container(
            height: 64,
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                // 1. حاوية الشريط الأساسي العائم (Floating Capsule Frame)
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.92),
                      borderRadius: BorderRadius.circular(32),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF0F172A).withValues(alpha: 0.08),
                          blurRadius: 24,
                          offset: const Offset(0, 8),
                          spreadRadius: -2,
                        ),
                        BoxShadow(
                          color: Colors.white.withValues(alpha: 0.8),
                          blurRadius: 1,
                          offset: const Offset(0, 1),
                        ),
                      ],
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.6),
                        width: 1.2,
                      ),
                    ),
                  ),
                ),

                // 2. العدسة الزجاجية السائلة المتحركة (Moving Refractive Glass Lens / Resting Pill)
                Positioned(
                  left: currentCenterX - (currentLensWidth / 2),
                  top: (64 - currentLensHeight) / 2,
                  width: currentLensWidth,
                  height: currentLensHeight,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(currentLensHeight / 2),
                    child: Stack(
                      children: [
                        // طبقة الانكسار للشادر عند توفر Impeller
                        if (_shaderLoaded && _fragmentShader != null)
                          Positioned.fill(
                            child: BackdropFilter(
                              filter: ui.ImageFilter.shader(_fragmentShader!),
                              child: const SizedBox.expand(),
                            ),
                          ),

                        // الرسم البصري للزجاج (Optical Specular Dome / Resting Pill)
                        Positioned.fill(
                          child: CustomPaint(
                            painter: _LiquidGlassPainter(
                              isMoving: isMoving,
                              stretchFactor: stretchFactor,
                              directionSign: directionSign,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // 3. أيقونات وعناوين التبويبات مع تشوه وانكسار بصري موضعي أثناء عبور العدسة
                Positioned.fill(
                  child: Row(
                    textDirection: isRtl ? TextDirection.rtl : TextDirection.ltr,
                    children: List.generate(count, (index) {
                      final tabCenterX = getTabCenterX(index);
                      final distFromLens = (tabCenterX - currentCenterX).abs();
                      final isUnderLens = distFromLens < currentLensRadius;

                      // حساب التكبير البصري الموضعي للعناصر تحت العدسة
                      double scale = 1.0;
                      double opticalShiftX = 0.0;
                      if (isUnderLens && isMoving) {
                        final normDist = distFromLens / currentLensRadius;
                        // منحنى جيب تمام يمنح تكبيراً مركزياً وتشوهاً انكسارياً على الحواف
                        scale = 1.0 + (0.28 * math.cos(normDist * math.pi / 2));
                        opticalShiftX = (tabCenterX - currentCenterX) * 0.12 * (1.0 - normDist);
                      }

                      final isTarget = index == widget.currentIndex;
                      final iconColor = isTarget ? widget.activeColor : widget.inactiveColor;
                      final labelColor = isTarget ? widget.activeColor : const Color(0xFF64748B);

                      return Expanded(
                        child: GestureDetector(
                          behavior: HitTestBehavior.opaque,
                          onTap: () => _handleTap(index),
                          child: Center(
                            child: Transform.translate(
                              offset: Offset(opticalShiftX, 0),
                              child: Transform.scale(
                                scale: scale,
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      widget.items[index].icon,
                                      size: 22,
                                      color: iconColor,
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      widget.items[index].label,
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: isTarget ? FontWeight.bold : FontWeight.w500,
                                        color: labelColor,
                                        letterSpacing: -0.2,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// راسم العدسة الزجاجية وانعكاسات الحواف ثلاثية الأبعاد
class _LiquidGlassPainter extends CustomPainter {
  final bool isMoving;
  final double stretchFactor;
  final double directionSign;

  _LiquidGlassPainter({
    required this.isMoving,
    required this.stretchFactor,
    required this.directionSign,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final rrect = RRect.fromRectAndRadius(
      Offset.zero & size,
      Radius.circular(size.height / 2),
    );

    if (!isMoving) {
      // حالة الاستقرار (Resting Pill): مطابقة تامة للفريمات 01 و05 و09
      // كبسولة رمادية زجاجية ناعمة جداً وخالية من أي حواف مشتتة
      final restingPaint = Paint()
        ..color = const Color(0xFFE2E8F0).withValues(alpha: 0.70)
        ..style = PaintingStyle.fill;
      canvas.drawRRect(rrect, restingPaint);
      return;
    }

    // حالة السائل المتحرك (Moving Liquid Glass Droplet): مطابقة للفريمات 02 و03 و06 و07
    // 1. جسم الزجاج البلوري نصف الشفاف مع تدرج محدب
    final glassGradient = ui.Gradient.radial(
      Offset(size.width * 0.50, size.height * 0.40),
      size.width * 0.60,
      [
        Colors.white.withValues(alpha: 0.65),
        const Color(0xFFE2E8F0).withValues(alpha: 0.35),
        const Color(0xFFCBD5E1).withValues(alpha: 0.20),
      ],
      [0.0, 0.70, 1.0],
    );
    final glassPaint = Paint()
      ..shader = glassGradient
      ..style = PaintingStyle.fill;
    canvas.drawRRect(rrect, glassPaint);

    // 2. ظل الانكسار الزجاجي السفلي (Caustic Drop Shadow)
    final shadowPaint = Paint()
      ..color = const Color(0xFF0F172A).withValues(alpha: 0.10)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(0, 3, size.width, size.height),
        Radius.circular(size.height / 2),
      ),
      shadowPaint,
    );

    // 3. حافة اللمعان الزجاجية العلوية المتقدمة (Leading Specular Highlight Rim)
    final rimPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.95)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.3;
    canvas.drawRRect(rrect, rimPaint);

    // 4. انعكاس الضوء البيضاوي في قمة الفقاعة الزجاجية (Specular Glare Arc)
    final glareWidth = size.width * 0.65;
    final glareHeight = size.height * 0.36;
    final glareLeft = (size.width - glareWidth) / 2 + (directionSign * stretchFactor * 3.0);
    final glareRect = Rect.fromLTWH(glareLeft, 2.0, glareWidth, glareHeight);
    final glarePaint = Paint()
      ..shader = ui.Gradient.linear(
        Offset(glareRect.left, glareRect.top),
        Offset(glareRect.left, glareRect.bottom),
        [
          Colors.white.withValues(alpha: 0.90),
          Colors.white.withValues(alpha: 0.0),
        ],
      )
      ..style = PaintingStyle.fill;
    canvas.drawRRect(
      RRect.fromRectAndRadius(glareRect, const Radius.circular(16)),
      glarePaint,
    );
  }

  @override
  bool shouldRepaint(covariant _LiquidGlassPainter oldDelegate) {
    return oldDelegate.isMoving != isMoving ||
        oldDelegate.stretchFactor != stretchFactor ||
        oldDelegate.directionSign != directionSign;
  }
}

/// منحنى النابض الحركي المضبوط (Snappy Critically-Damped Spring)
/// زمن الاستجابة سريع (350-450ms) مع استقرار هادئ ومباشر دون اهتزاز متكرر
class _SnappySpringCurve extends Curve {
  final double zeta;
  final double wn;

  const _SnappySpringCurve({
    this.zeta = 0.85,
    this.wn = 7.5,
  });

  @override
  double transformInternal(double t) {
    if (t <= 0.0) return 0.0;
    if (t >= 1.0) return 1.0;
    final wd = wn * math.sqrt(1.0 - zeta * zeta);
    final decay = math.exp(-zeta * wn * t);
    return 1.0 - decay * (math.cos(wd * t) + (zeta * wn / wd) * math.sin(wd * t));
  }
}
