import React, { useState } from 'react';
import { ShieldCheck, LogIn, AlertCircle, Smartphone, KeyRound } from 'lucide-react';

export default function ClientLogin({ onLoginSuccess }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (phone.length < 10 || code.length < 5) {
      setError('يرجى إدخال رقم الموبايل وكود الاشتراك بشكل صحيح.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    // Normalization: Remove non-numeric chars, remove leading +20 or 002
    let normalizedPhone = phone.replace(/\D/g, '');
    if (normalizedPhone.startsWith('20') && normalizedPhone.length > 10) normalizedPhone = normalizedPhone.substring(2);
    if (normalizedPhone.startsWith('0020')) normalizedPhone = normalizedPhone.substring(4);
    if (!normalizedPhone.startsWith('01')) {
      // Local fallback for numbers lacking 01
      if (normalizedPhone.startsWith('1')) normalizedPhone = '0' + normalizedPhone;
    }

    try {
      const response = await fetch('/api/v1/auth/login-fast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_code: code, phone_number: normalizedPhone })
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        localStorage.setItem('kz_client_token', data.token);
        localStorage.setItem('kz_client_code', code);
        localStorage.setItem('kz_client_phone', phone);
        setIsLoading(false);
        if(onLoginSuccess) onLoginSuccess();
      } else {
        setError(data.error || 'بيانات الدخول غير صحيحة. تأكد من الكود ورقم الموبايل المسجل.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl relative overflow-hidden">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

        <div className="text-center pt-2">
          <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <ShieldCheck size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">تسجيل الدخول</h2>
          <p className="text-xs text-slate-600 mt-2 font-medium">أدخل رقم الموبايل وكود الاشتراك السري للبدء</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 mt-8">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500">رقم الموبايل المسجل</label>
            <div className="relative flex items-center">
              <span className="absolute right-4 text-slate-500">
                <Smartphone size={18} />
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 01012345678"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-12 pl-4 py-3.5 text-right text-sm font-bold text-slate-900 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500">كود الاشتراك</label>
            <div className="relative flex items-center">
              <span className="absolute right-4 text-slate-500">
                <KeyRound size={18} />
              </span>
              <input
                type="number"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثال: 84902"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-12 pl-4 py-3.5 text-center text-xl font-black tracking-widest text-slate-900 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                dir="ltr"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-xs font-bold">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-slate-900 font-black py-4 rounded-xl transition shadow-sm shadow-slate-200/50 shadow-blue-600/20 active:scale-95 disabled:opacity-50 mt-4"
          >
            {isLoading ? (
              <span className="animate-pulse">جاري التحقق الآمن...</span>
            ) : (
              <>
                <span>دخول للبرنامج</span>
                <LogIn size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
