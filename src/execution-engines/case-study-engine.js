/**
 * Automated Case Study & Transformation Card Generator (محرك توليد بطاقة التحول التسويقية)
 *
 * Compiles Week 1 vs Week 16 transformation metrics:
 *   - Weight Delta & Loss %
 *   - Waist Delta & Loss %
 *   - Strength progression on main lifts
 *   - Branded Case Study Data Object ready for 4K canvas rendering & WhatsApp/Instagram export
 */

export function generateClientCaseStudy({
  client_name,
  client_code = '1',
  package_name = 'باقة MAX',
  starting_weight_kg = 88.0,
  final_weight_kg = 75.2,
  starting_waist_cm = 98.0,
  final_waist_cm = 82.0,
  starting_body_fat_percent = 28.5,
  final_body_fat_percent = 15.0,
  total_weeks = 16,
  adherence_rate_percent = 96,
  strength_gains = [
    { exercise: 'Leg Press (دفع أرجل)', start: '120 kg', final: '220 kg' },
    { exercise: 'Lat Pulldown (سحب ظهر)', start: '40 kg', final: '65 kg' },
    { exercise: 'Chest Press (دفع صدر)', start: '35 kg', final: '60 kg' }
  ],
  before_photo_url = null,
  after_photo_url = null,
  coach_quote_ar = 'تحول بطولي يعكس قوة الالتزام بالخطة العلمية والتغذية السريرية المتخصصة.'
}) {
  const weightLossKg = Math.round((starting_weight_kg - final_weight_kg) * 10) / 10;
  const weightLossPercent = Math.round(((weightLossKg / starting_weight_kg) * 100) * 10) / 10;

  const waistLossCm = Math.round((starting_waist_cm - final_waist_cm) * 10) / 10;
  const waistLossPercent = Math.round(((waistLossCm / starting_waist_cm) * 100) * 10) / 10;

  const bodyFatDrop = Math.round((starting_body_fat_percent - final_body_fat_percent) * 10) / 10;

  return {
    success: true,
    platform_brand: 'Z Coaching Platform - Captain Karim Zakaria',
    client_identity: {
      name: client_name,
      code: `#${client_code}`,
      package: package_name,
      duration: `${total_weeks} أسبوعاً`
    },
    transformation_metrics: {
      weight: {
        start: `${starting_weight_kg} kg`,
        final: `${final_weight_kg} kg`,
        delta: `-${weightLossKg} kg`,
        percent: `-${weightLossPercent}%`
      },
      waist: {
        start: `${starting_waist_cm} cm`,
        final: `${final_waist_cm} cm`,
        delta: `-${waistLossCm} cm`,
        percent: `-${waistLossPercent}%`
      },
      body_fat: {
        start: `${starting_body_fat_percent}%`,
        final: `${final_body_fat_percent}%`,
        drop: `-${bodyFatDrop}%`
      },
      adherence: `${adherence_rate_percent}%`
    },
    strength_gains,
    photos: {
      before: before_photo_url,
      after: after_photo_url
    },
    coach_testimonial_ar: coach_quote_ar,
    social_caption_template_ar: `قصة نجاح في ${total_weeks} أسبوعاً:\nالمتدرب ${client_name} نجح في خسارة ${weightLossKg} كجم ونزول ${waistLossCm} سم من محيط الخصر، مع مضاعفة أوزان التمرين والتزام بنسبة ${adherence_rate_percent}%.\n\nالتحول نتاج تخطيط علمي وتغذية سريرية وتدريب مبرمج بدقة فسيولوجية.\n\nتدريب ومتابعة: كابتن كريم زكريا - Z Coaching`
  };
}
