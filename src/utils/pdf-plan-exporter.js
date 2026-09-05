/**
 * Master PDF & Print Compiler Engine
 */

export function generatePrintablePlanHTML({ client, plan, date = new Date().toISOString().split('T')[0] }) {
  const { prehab = {}, workout = { exercises: [] }, meals = [], guidelines = {} } = plan || {};

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>خطة التدريب والتغذية - ${client?.name || 'مشترك'}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 11px; line-height: 1.4; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 900; }
    .header p { margin: 2px 0 0; color: #475569; font-size: 10px; }
    .macro-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; margin-bottom: 12px; text-align: center; }
    .macro-box { font-size: 10px; font-weight: bold; }
    .macro-val { font-size: 14px; font-weight: 900; color: #0f172a; }
    .section-title { font-size: 12px; font-weight: 900; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 3px; margin: 10px 0 6px; color: #1e293b; display: flex; justify-content: space-between; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .table th, .table td { border: 1px solid #e2e8f0; padding: 5px 6px; text-align: right; }
    .table th { background: #f1f5f9; font-weight: 800; font-size: 10px; }
    .badge { display: inline-block; padding: 1px 4px; border-radius: 3px; font-size: 9px; font-weight: bold; background: #e2e8f0; }
    .badge-rir { background: #dcfce7; color: #166534; }
    .badge-prehab { background: #e0e7ff; color: #3730a3; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>برنامج التدريب والتغذية الإكلينيكي</h1>
      <p>المشترك: <strong>${client?.name || 'غير محدد'}</strong> | التاريخ: ${date}</p>
    </div>
  </div>

  <div class="macro-bar">
    <div class="macro-box">السعرات اليومية<div class="macro-val">${client?.target_calories || 1900} Kcal</div></div>
    <div class="macro-box">البروتين<div class="macro-val">${client?.target_protein || 150}g</div></div>
    <div class="macro-box">الكاربوهيدرات<div class="macro-val">${client?.target_carbs || 190}g</div></div>
    <div class="macro-box">الدهون الصحية<div class="macro-val">${client?.target_fats || 60}g</div></div>
  </div>

  ${prehab && prehab.has_prehab ? `
    <div class="section-title">
      <span>روتين تجهيز المفاصل والإحماء (${prehab.total_duration_minutes} دقائق)</span>
    </div>
    <table class="table">
      <thead>
        <tr><th>التمرين</th><th>المجموعات</th><th>التكرار</th></tr>
      </thead>
      <tbody>
        ${(prehab.exercises || []).map((ex) => `
          <tr><td><strong>${ex.name_ar}</strong></td><td>${ex.sets}</td><td>${ex.reps || `${ex.hold_seconds} ثانية`}</td></tr>
        `).join('')}
      </tbody>
    </table>
  ` : ''}

  <div class="section-title">
    <span>جدول التمارين البرمجية</span>
  </div>
  <table class="table">
    <thead>
      <tr><th>#</th><th>اسم الحركة</th><th>المجموعات</th><th>التكرار</th><th>الشدة</th></tr>
    </thead>
    <tbody>
      ${(workout.exercises || []).map((ex, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${ex.name_ar || '-'}</strong></td>
          <td>${ex.sets || '-'}</td>
          <td>${ex.reps || '-'}</td>
          <td><span class="badge badge-rir">RIR ${ex.target_rir ?? 2}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">
    <span>خطة الوجبات التغذوية</span>
  </div>
  <table class="table">
    <thead>
      <tr><th>الوجبة</th><th>المكونات</th><th>السعرات</th></tr>
    </thead>
    <tbody>
      ${meals.map((meal) => `
        <tr>
          <td><strong>${meal.title_ar}</strong></td>
          <td>${(meal.items || []).map((i) => `• ${i.name_ar}: ${i.grams} جم`).join('<br>')}</td>
          <td><strong>${meal.calories}</strong> Kcal</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
  `;
}