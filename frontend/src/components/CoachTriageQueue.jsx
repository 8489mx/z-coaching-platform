import React, { useState } from 'react';
import { getTriageWhatsAppAction } from '../utils/whatsapp-generator';

export default function CoachTriageQueue({
  triageData = {
    high_priority_queue: [],
    medium_priority_queue: [],
    routine_queue: [],
    total_actions_needed: 0
  },
  onClientUpdated
}) {
  const [editingClient, setEditingClient] = useState(null);
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const openEditModal = (item) => {
    setEditingClient(item);
    setNewPhone(item.phone || item.client_phone || '');
    setNewName(item.name || item.client_name || '');
    setSaveMessage('');
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (!editingClient) return;

    setSaving(true);
    setSaveMessage('');

    try {
      const res = await fetch('/api/v1/coach/update-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: editingClient.client_id || editingClient.id,
          phone: newPhone.trim(),
          name: newName.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveMessage('تم الحفظ بنجاح');
        if (onClientUpdated) {
          onClientUpdated({
            client_id: editingClient.client_id || editingClient.id,
            phone: newPhone.trim(),
            name: newName.trim()
          });
        }
        setTimeout(() => {
          setEditingClient(null);
          setSaveMessage('');
        }, 800);
      } else {
        setSaveMessage(data.message || 'حدث خطأ أثناء التحديث');
      }
    } catch (err) {
      setSaveMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderQueueItem = (item, isHighPriority = true) => {
    const waAction = getTriageWhatsAppAction(item, item.action_type);

    return (
      <div
        key={item.client_id || item.id || Math.random()}
        className={`p-4 rounded-xl border mb-3 flex items-center justify-between transition ${
          isHighPriority
            ? 'bg-rose-950/20 border-rose-800/40 text-rose-100'
            : 'bg-amber-950/20 border-amber-800/40 text-amber-100'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">{item.name}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                isHighPriority
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {item.badge_ar || (isHighPriority ? 'عاجل' : 'متابعة')}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed m-0">{item.reason_ar || item.message_ar}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit Phone / Client Details Button */}
          <button
            type="button"
            onClick={() => openEditModal(item)}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-300 text-slate-700 text-xs px-2.5 py-2 rounded-lg border border-slate-300 transition cursor-pointer"
            title="تعديل بيانات المشترك"
          >
            <span>تعديل</span>
          </button>

          {/* Direct WhatsApp Trigger Button */}
          <a
            href={waAction.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-900 text-xs font-bold px-3 py-2 rounded-lg transition active:scale-95 shadow-md shadow-emerald-950 no-underline"
          >
            <span>واتساب</span>
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
            </svg>
          </a>
        </div>
      </div>
    );
  };

  const totalActions = triageData.total_actions_needed !== undefined
    ? triageData.total_actions_needed
    : (triageData.high_priority_queue?.length || 0) + (triageData.medium_priority_queue?.length || 0);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-900 mb-6" dir="rtl">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 m-0">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span>طابور الإجراءات والأولويات اليومية (Triage)</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1 mb-0">
            المهام العاجلة مرتبة حسب الأولوية الإكلينيكية لإنهاء المتابعات في أقل من 15 دقيقة
          </p>
        </div>
        <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs px-3 py-1 rounded-full font-bold">
          {totalActions} إجراءات معلقة
        </span>
      </div>

      {/* High Priority Queue */}
      {triageData.high_priority_queue?.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>أولوية قصوى (ردود وتجديدات فورية)</span>
          </div>
          {triageData.high_priority_queue.map((item) => renderQueueItem(item, true))}
        </div>
      )}

      {/* Medium Priority Queue */}
      {triageData.medium_priority_queue?.length > 0 && (
        <div>
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>أولوية متوسطة (استباق وتنبيهات)</span>
          </div>
          {triageData.medium_priority_queue.map((item) => renderQueueItem(item, false))}
        </div>
      )}

      {totalActions === 0 && (
        <div className="text-center py-6 text-slate-600 text-sm">
          لا توجد مهام معلقة؛ جميع المتدربين في حالة التزام ومتابعة مستقرة.
        </div>
      )}

      {/* Inline Edit Modal */}
      {editingClient && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-300 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-slate-900">
            <h3 className="font-bold text-base mb-3 text-slate-900">تعديل بيانات المشترك</h3>

            {saveMessage && (
              <div className="bg-slate-100 text-emerald-400 text-xs p-2 rounded-lg mb-3 text-center">
                {saveMessage}
              </div>
            )}

            <form onSubmit={handleSaveClient} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">اسم المشترك</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">رقم الهاتف المسجل</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ التعديل'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 bg-slate-100 hover:bg-slate-300 text-slate-700 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
