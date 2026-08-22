import React, { useState } from 'react';
import { evaluateWeeklyProgress } from '../../utils/weeklyAuditEngine';
import { calculateSubscriptionStatus } from '../../utils/subscriptionLifecycleEngine';

export default function CoachCommandCenter({ clients = [], onUpdateClientPlan = () => {} }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // 'ALL' | 'URGENT' | 'CHECKIN_PENDING' | 'EXPIRING'

  // Process subscription & radar statuses
  const processedClients = clients.map((client) => {
    const subStatus = calculateSubscriptionStatus({
      startDateStr: client.subscription_start,
      durationDays: client.subscription_days || 30,
      freezeLogs: client.freeze_logs || []
    });

    let triageCategory = 'COMPLIANT';
    if (subStatus.radar_alert || subStatus.status === 'EXPIRED') {
      triageCategory = 'EXPIRING';
    } else if (client.pending_checkin) {
      triageCategory = 'CHECKIN_PENDING';
    } else if (client.recent_adherence < 75) {
      triageCategory = 'URGENT';
    }

    return { ...client, subStatus, triageCategory };
  });

  const filteredClients = processedClients.filter((c) => {
    if (selectedFilter === 'ALL') return true;
    return c.triageCategory === selectedFilter;
  });

  const handleApproveCheckin = (client) => {
    const checkin = client.pending_checkin;
    const evaluation = evaluateWeeklyProgress({
      currentWeightKg: checkin.current_weight,
      previousWeightKg: checkin.previous_weight,
      currentWaistCm: checkin.current_waist,
      previousWaistCm: checkin.previous_waist,
      adherenceRatePct: checkin.adherence_pct,
      currentCalories: client.current_calories,
      weeksOnCurrentCalories: client.weeks_on_calories || 1,
      goalType: client.goal_type || 'FAT_LOSS',
      isFemale: client.gender === 'FEMALE',
      isMenstrualPhase: checkin.is_menstrual_phase || false
    });

    onUpdateClientPlan(client.id, {
      calories: evaluation.new_calories,
      last_evaluation: evaluation,
      pending_checkin: null
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans" dir="rtl">
      {/* Header & Metrics Bar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">غرفة قيادة الكوتش | Coach Command Center</h1>
          <p className="text-sm text-slate-400">إدارة المشتركين، اتخاذ قرارات المتابعة الأسبوعية، ورادار الاشتراكات بنقرة واحدة</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            الكل ({processedClients.length})
          </button>
          <button
            onClick={() => setSelectedFilter('CHECKIN_PENDING')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedFilter === 'CHECKIN_PENDING' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
            }`}
          >
            متابعات معلقة ({processedClients.filter((c) => c.triageCategory === 'CHECKIN_PENDING').length})
          </button>
          <button
            onClick={() => setSelectedFilter('EXPIRING')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedFilter === 'EXPIRING' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-rose-400 hover:bg-slate-700'
            }`}
          >
            رادار التجديد ({processedClients.filter((c) => c.triageCategory === 'EXPIRING').length})
          </button>
        </div>
      </header>

      {/* Main Roster Grid */}
      <main className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg text-white">{client.name}</h3>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    client.subStatus.status === 'EXPIRED'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : client.subStatus.radar_alert
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}
                >
                  {client.subStatus.is_frozen
                    ? 'مجمد'
                    : client.subStatus.status === 'EXPIRED'
                    ? 'منتهي'
                    : `متبقي ${client.subStatus.days_remaining} يوم`}
                </span>
              </div>

              <div className="text-xs text-slate-400 space-y-1 mb-4">
                <p>الهدف: <span className="text-slate-200">{client.goal_type === 'FAT_LOSS' ? 'خسارة دهون' : 'بناء عضلي'}</span></p>
                <p>السعرات الحالية: <span className="text-indigo-400 font-bold">{client.current_calories} Kcal</span></p>
              </div>

              {/* Check-in Decision Card if pending */}
              {client.pending_checkin && (
                <div className="bg-slate-950/80 border border-amber-500/30 rounded-lg p-3 my-3">
                  <div className="flex justify-between items-center text-xs font-bold text-amber-400 mb-2">
                    <span>تقرير المتابعة الأسبوعية</span>
                    <span>التزام {client.pending_checkin.adherence_pct}%</span>
                  </div>
                  <div className="text-xs text-slate-300 space-y-1 mb-3">
                    <p>الوزن: {client.pending_checkin.previous_weight}kg ➔ <strong className="text-white">{client.pending_checkin.current_weight}kg</strong></p>
                    <p>الخصر: {client.pending_checkin.previous_waist}cm ➔ <strong className="text-white">{client.pending_checkin.current_waist}cm</strong></p>
                  </div>
                  <button
                    onClick={() => handleApproveCheckin(client)}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-md transition-colors"
                  >
                    اعتماد القرار وتحديث السعرات
                  </button>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-4">
              <a
                href={`https://wa.me/${client.phone}?text=${encodeURIComponent(client.subStatus.whatsapp_renewal_template)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-center py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
              >
                واتساب مباشر
              </a>
              <button
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
              >
                تعديل الخطة
              </button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
