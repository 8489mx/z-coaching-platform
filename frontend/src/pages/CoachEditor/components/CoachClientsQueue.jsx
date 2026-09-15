import React from 'react';
import { Users, AlertCircle, Clock, RotateCw, Search } from 'lucide-react';

export function CoachClientsQueue({
  urgentCount,
  pendingPlanCount,
  needsUpdateCount,
  clientsList = [],
  queueFilter,
  setQueueFilter,
  queueSearch,
  setQueueSearch,
  showQueueSlider,
  setShowQueueSlider,
  displayedQueue = [],
  filteredQueue = [],
  program,
  clientCodeParam,
  handleSelectClient
}) {
  return (
    <div 
      style={{ 
        background: '#FFFFFF', 
        border: '1px solid #E2E8F0', 
        borderRadius: '12px', 
        padding: '10px 14px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)'
      }}
      dir="rtl"
    >
      {/* Header row of Queue Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={15} color="#0F172A" />
            <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>طابور المشتركين والإجراءات:</strong>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {[
              { id: 'ACTION_NEEDED', label: 'مطلوب إجراء', icon: AlertCircle, count: urgentCount },
              { id: 'PENDING_PLAN', label: 'بانتظار خطة', icon: Clock, count: pendingPlanCount },
              { id: 'NEEDS_UPDATE', label: 'مطلوب تعديل', icon: RotateCw, count: needsUpdateCount },
              { id: 'ALL', label: 'كافة المشتركين', icon: Users, count: clientsList.length }
            ].map((qf) => {
              const Icon = qf.icon;
              const isSel = queueFilter === qf.id;
              return (
                <button
                  key={qf.id}
                  type="button"
                  onClick={() => setQueueFilter(qf.id)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: isSel ? 800 : 600,
                    border: isSel ? '1px solid #0F172A' : '1px solid #E2E8F0',
                    background: isSel ? '#0F172A' : '#F8FAFC',
                    color: isSel ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Icon size={11} color={isSel ? '#FFFFFF' : '#64748B'} />
                  <span>{qf.label}</span>
                  <span style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    padding: '0 4px',
                    borderRadius: '8px',
                    background: isSel ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                    color: isSel ? '#FFFFFF' : '#0F172A'
                  }}>
                    {qf.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Search & Toggle Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 6px', height: '26px', width: '160px', gap: '4px' }}>
            <Search size={11} color="#94A3B8" />
            <input
              type="text"
              placeholder="بحث سريع..."
              value={queueSearch}
              onChange={(e) => setQueueSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '10.5px', outline: 'none', width: '100%' }}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowQueueSlider(!showQueueSlider)}
            style={{ height: '26px', padding: '0 8px', borderRadius: '8px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#64748B', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
          >
            {showQueueSlider ? 'إخفاء الشريط' : 'إظهار المشتركين'}
          </button>
        </div>
      </div>

      {/* Horizontal Slider Cards Container */}
      {showQueueSlider && (
        <div 
          style={{ 
            display: 'flex', 
            gap: '8px', 
            overflowX: 'auto', 
            paddingBottom: '4px',
            scrollbarWidth: 'thin'
          }}
        >
          {displayedQueue.map((client) => {
            const isSelected = String(program?.client?.client_code || clientCodeParam) === String(client.client_code || client.id);
            const isPending = client.queue_status === 'PENDING_PLAN';
            const isNeedsUpdate = client.queue_status === 'NEEDS_UPDATE';
            const injuries = Array.isArray(client.injuries) ? client.injuries : [];
            const hasInjury = injuries.some(inj => {
              const s = typeof inj === 'string' ? inj : (inj?.name || inj?.area || inj?.conditionCode || '');
              return s && !/سليم|لا توجد|متابعة اعتيادية|لا يوجد/i.test(s);
            });

            return (
              <div
                key={client.id || client.client_code}
                onClick={() => handleSelectClient(client.client_code || client.id)}
                style={{
                  minWidth: '210px',
                  flexShrink: 0,
                  background: isSelected ? '#0F172A' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#0F172A',
                  border: isSelected ? '1px solid #0F172A' : '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  boxShadow: isSelected ? '0 2px 6px rgba(15, 23, 42, 0.25)' : 'none',
                  transition: 'all 0.12s ease'
                }}
              >
                {/* Top Row: Name + Code */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                    {client.full_name || client.name}
                  </strong>
                  <span style={{
                    fontSize: '9.5px',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    padding: '1px 4px',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                    color: isSelected ? '#FFFFFF' : '#475569'
                  }}>
                    #{client.client_code || client.id}
                  </span>
                </div>

                {/* Status Row: Queue Status + Optional Injury Badge + Package */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '6px',
                      background: isSelected 
                        ? (isPending ? '#FEF08A' : isNeedsUpdate ? '#BAE6FD' : 'rgba(255,255,255,0.15)')
                        : (isPending ? '#FEF9C3' : isNeedsUpdate ? '#E0F2FE' : '#F1F5F9'),
                      color: isSelected
                        ? (isPending ? '#854D0E' : isNeedsUpdate ? '#0369A1' : '#FFFFFF')
                        : (isPending ? '#854D0E' : isNeedsUpdate ? '#0369A1' : '#475569')
                    }}>
                      {client.queue_label}
                    </span>

                    {hasInjury && (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '1px 4px',
                        borderRadius: '6px',
                        background: isSelected ? '#DC2626' : '#FEE2E2',
                        color: isSelected ? '#FFFFFF' : '#B91C1C',
                        border: isSelected ? 'none' : '1px solid #FECACA'
                      }}>
                        إصابة
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '9.5px', color: isSelected ? 'rgba(255,255,255,0.7)' : '#94A3B8' }}>
                    {client.package_name || 'باقة إليت'}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredQueue.length > 35 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '150px',
              flexShrink: 0,
              background: '#F8FAFC',
              border: '1px dashed #CBD5E1',
              borderRadius: '10px',
              padding: '8px 12px',
              fontSize: '11px',
              color: '#64748B',
              textAlign: 'center',
              fontWeight: 600
            }}>
              + {filteredQueue.length - 35} مشترك آخر (استخدم البحث للوصول المباشر)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
