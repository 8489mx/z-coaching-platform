import { describe, it, expect, vi } from 'vitest';
import React from '../frontend/node_modules/react/index.js';
import { renderToStaticMarkup } from '../frontend/node_modules/react-dom/server.node.js';
import IntakeAuditDetailModal from '../frontend/src/components/intake/IntakeAuditDetailModal.jsx';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}));

describe('IntakeAuditDetailModal Guard', () => {
  it('does not invent default values for an empty submission', () => {
    const submission = { id: 'empty-123', user: { full_name: '' }, answers: {} };
    const html = renderToStaticMarkup(
      React.createElement(IntakeAuditDetailModal, { submission, onClose: () => {} })
    );
    
    const disallowedDefaults = [
      'FAT_LOSS', 'حرق وخسارة الدهون',
      'INTERMEDIATE', 'متوسط (6ش - سنتين)',
      'MODERATE', 'متوسط (حركة يومية)',
      '4 أيام', '4 أيام',
      '170 سم', '70 كجم'
    ];

    for (const d of disallowedDefaults) {
      if (html.includes(d)) {
         throw new Error(`Found disallowed default value: ${d}`);
      }
    }
    
    // Check that "لم يُجب" is present (since everything is empty)
    expect(html).toContain('لم يُجب');

    const requiredFields = [
      'الجنس', 'العمر', 'الطول (سم)', 'الوزن (كجم)', 'محيط الرقبة (سم)', 'محيط الخصر (سم)', 'محيط الحوض (سم)', 'الهدف الأساسي', 'مستوى الحركة اليومية (NEAT)', 'طبيعة العمل',
      'أعراض خطيرة', 'الحالات الطبية المختارة', 'نوع السكري', 'يستخدم الإنسولين', 'السكر التراكمي (HbA1c)', 'أنيميا الفول (G6PD)', 'ارتفاع ضغط الدم', 'النقرس', 'عملية سمنة سابقة', 'سعة الوجبة (جرام)', 'متلازمة الإغراق (Dumping)', 'تكيس المبايض (PCOS)', 'مرضعة', 'ولادة حديثة', 'قائمة الأدوية والمكملات', 'تفاصيل الأدوية والمكملات',
      'مناطق الإصابة', 'إصابات الركبة', 'إصابات الظهر والعمود الفقري', 'إصابات الكتف', 'إصابات الكور', 'إصابات مفاصل أخرى', 'طبيعة الإصابة', 'يخف الألم بالراحة',
      'الديانة', 'نمط الصيام المسيحي', 'ممنوعات وحساسية صارمة', 'أطعمة غير مفضلة', 'عدد الوجبات', 'صيام متقطع', 'ميزانية الطعام', 'القدرة على تحضير الطعام', 'سكر المشروبات', 'نمط النوم', 'متوسط ساعات النوم', 'ساعة النوم المعتادة',
      'بيئة التدريب', 'أيام التمرين في الأسبوع', 'مستوى الخبرة', 'يمارس رياضة أخرى', 'اسم الرياضة الأخرى', 'ساعات الرياضة الأخرى', 'التدريب مؤخراً', 'عضلات التركيز',
      'الأمام', 'الجانب', 'الخلف', 'InBody', 'مرفقات طبية أخرى',
      'الموافقة القانونية (PDPL)'
    ];

    for (const field of requiredFields) {
      if (!html.includes(field)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  });
});

