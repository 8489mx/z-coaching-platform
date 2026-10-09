import 'package:flutter_test/flutter_test.dart';
import 'package:z_coaching_app/core/constants/api_constants.dart';
import 'package:z_coaching_app/features/auth/models/client_user.dart';
import 'package:z_coaching_app/features/nutrition/models/meal_models.dart';
import 'package:z_coaching_app/features/workout/models/workout_models.dart';

void main() {
  group('فحوصات نماذج التوثيق والمشترك', () {
    test('تحويل بيانات المشترك من وإلى JSON بشكل سليم', () {
      final json = {
        'id': 101,
        'client_code': 'CLIENT-99',
        'full_name': 'أحمد محمد',
        'phone_number': '01012345678',
        'subscription_tier': 'ELITE',
      };

      final client = ClientUser.fromJson(json);
      expect(client.id, 101);
      expect(client.clientCode, 'CLIENT-99');
      expect(client.fullName, 'أحمد محمد');
      expect(client.subscriptionTier, 'ELITE');

      final backToJson = client.toJson();
      expect(backToJson['id'], 101);
      expect(backToJson['client_code'], 'CLIENT-99');
    });
  });

  group('فحوصات محرك التغذية والوجبات', () {
    test('احتساب مجموع السعرات والماكروز في الوجبة بشكل دقيق', () {
      final meal = Meal(
        id: 'm1',
        name: 'وجبة تجريبية',
        items: [
          FoodItem(id: '1', name: 'دجاج', grams: 200, calories: 330, protein: 62.0, carbs: 0, fat: 7.2),
          FoodItem(id: '2', name: 'أرز', grams: 200, calories: 260, protein: 5.4, carbs: 56.0, fat: 0.6),
        ],
      );

      expect(meal.totalCalories, 590);
      expect(meal.totalProtein, 67.4);
      expect(meal.totalCarbs, 56.0);
      expect(meal.totalFat, 7.8);
    });

    test('استخراج الأهداف اليومية الافتراضية عند عدم توفر بيانات', () {
      final target = DailyMacroTarget.fromJson(null);
      expect(target.calories, 2200);
      expect(target.protein, 160);
      expect(target.carbs, 220);
      expect(target.fat, 65);
    });
  });

  group('فحوصات سجل التمارين الميداني', () {
    test('تتبع اكتمال الجولات وحساب نسبة التقدم بدقة', () {
      final session = WorkoutSession(
        id: 's1',
        dayName: 'صدر وبايسبس',
        warmupProtocol: 'إحماء عام',
        exercises: [
          Exercise(
            id: 'e1',
            name: 'بنش برس',
            targetSets: 2,
            targetReps: '8',
            restSeconds: 90,
            safetyNote: 'أمان',
            sets: [
              WorkoutSet(setNumber: 1, targetReps: '8', isCompleted: true),
              WorkoutSet(setNumber: 2, targetReps: '8', isCompleted: true),
            ],
          ),
          Exercise(
            id: 'e2',
            name: 'تفتيح',
            targetSets: 2,
            targetReps: '12',
            restSeconds: 60,
            safetyNote: 'أمان',
            sets: [
              WorkoutSet(setNumber: 1, targetReps: '12', isCompleted: false),
              WorkoutSet(setNumber: 2, targetReps: '12', isCompleted: false),
            ],
          ),
        ],
      );

      expect(session.totalSets, 4);
      expect(session.totalCompletedSets, 2);
      expect(session.completionProgress, 0.5);
      expect(session.exercises[0].isCompleted, true);
      expect(session.exercises[1].isCompleted, false);
    });
  });

  group('ثوابت الروابط', () {
    test('التحقق من صحة مسارات واجهات البرمجة للخادم', () {
      expect(ApiConstants.loginFast, '/api/v1/auth/login-fast');
      expect(ApiConstants.activeProgram, '/api/v1/programs/active');
      expect(ApiConstants.submitCheckin, '/api/v1/checkin');
    });
  });
}
