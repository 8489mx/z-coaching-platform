import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveSession, isClientLoggedIn } from '../utils/auth';

export default function ClientLogin() {
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isClientLoggedIn()) {
      navigate('/client/today', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/client/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_code: code.trim(), phone: phone.trim() })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'بيانات الدخول غير صحيحة، يرجى مراجعة الكود ورقم الهاتف');
      }

      saveSession(data.client || data.user || { client_code: code.trim(), phone: phone.trim() });
      navigate('/client/today', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white" dir="rtl">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="w-4 h-4 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <h1 className="text-xl font-bold text-white m-0">تسجيل الدخول</h1>
          <p className="text-xs text-slate-400 mt-1 mb-0">أدخل كود المشترك ورقم هاتفك للمتابعة</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">كود المشترك</label>
            <input
              type="text"
              required
              placeholder="مثال: 1042"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">رقم الهاتف المسجل</label>
            <input
              type="tel"
              required
              placeholder="010XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold py-3 rounded-xl text-sm transition cursor-pointer"
          >
            {loading ? 'جاري التحقق...' : 'دخول للتطبيق'}
          </button>
        </form>
      </div>
    </div>
  );
}
