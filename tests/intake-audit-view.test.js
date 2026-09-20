import { describe, it, expect, vi } from 'vitest';
import React from '../frontend/node_modules/react/index.js';
import { renderToStaticMarkup } from '../frontend/node_modules/react-dom/server.node.js';
import IntakeAuditDetailModal from '../frontend/src/components/intake/IntakeAuditDetailModal.jsx';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}));

describe('IntakeAuditDetailModal Guard', () => {
  it('translates known codes, leaves unknown codes as is, and shows لم يُجب for empty fields', () => {
    // 1) Test with known codes, unknown codes, and empty fields
    const submission = { 
      id: 'test-123', 
      user: { full_name: 'Test' }, 
      answers: {
        primary_goal: 'FAT_LOSS', // Known code
        neat_level: 'UNKNOWN_LEVEL', // Unknown code
        occupation_type: '' // Empty field
      } 
    };

    const html = renderToStaticMarkup(
      React.createElement(IntakeAuditDetailModal, { submission, onClose: () => {} })
    );
    
    // Check 1: Known code is translated
    if (!html.includes('حرق وخسارة الدهون')) {
      throw new Error('Known code (FAT_LOSS) was not translated to Arabic.');
    }
    if (html.includes('FAT_LOSS')) {
      throw new Error('The raw known code (FAT_LOSS) should not be rendered.');
    }

    // Check 2: Unknown code is rendered as is
    if (!html.includes('UNKNOWN_LEVEL')) {
      throw new Error('Unknown code (UNKNOWN_LEVEL) was not rendered as is.');
    }

    // Check 3: Empty fields show لم يُجب
    if (!html.includes('لم يُجب')) {
      throw new Error('Empty fields did not render as "لم يُجب".');
    }

    // Check 4: All field labels are present
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
        throw new Error(`Missing required field label: ${field}`);
      }
    }
  });
});
