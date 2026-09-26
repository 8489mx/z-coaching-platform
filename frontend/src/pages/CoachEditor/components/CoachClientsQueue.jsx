import React from 'react';
import { Users, AlertCircle, Clock, RotateCw } from 'lucide-react';
import { TableSearch } from '@/shared/components/table-search';

/**
 * The coach's client list, beside the editor and always open: search, four filters, and one row per
 * client. It used to be a strip hidden behind a button that scrolled sideways, so the coach reached
 * the next client with a Next arrow instead of seeing everyone at once.
 */
export function CoachClientsQueue({
  urgentCount,
  pendingPlanCount,
  needsUpdateCount,
  clientsList = [],
  queueFilter,
  setQueueFilter,
  queueSearch,
  setQueueSearch,
  displayedQueue = [],
  filteredQueue = [],
  program,
  clientCodeParam,
  handleSelectClient
}) {
  const filters = [
    { id: 'ACTION_NEEDED', label: 'مطلوب إجراء', icon: AlertCircle, count: urgentCount },
    { id: 'PENDING_PLAN', label: 'بانتظار خطة', icon: Clock, count: pendingPlanCount },
    { id: 'NEEDS_UPDATE', label: 'مطلوب تعديل', icon: RotateCw, count: needsUpdateCount },
    { id: 'ALL', label: 'الكل', icon: Users, count: clientsList.length }
  ];

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)',
        position: 'sticky',
        top: '12px',
        maxHeight: 'calc(100vh - 24px)'
      }}
      dir="rtl"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Users size={15} color="#0F172A" />
        <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>المشتركين</strong>
        <span style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: 700 }}>({filteredQueue.length})</span>
      </div>

      <TableSearch
        value={queueSearch}
        onChange={setQueueSearch}
        placeholder="ابحث بالاسم أو الكود"
      />

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {filters.map((qf) => {
          const Icon = qf.icon;
          const isSel = queueFilter === qf.id;
          return (
            <button
              key={qf.id}
              type="button"
              onClick={() => setQueueFilter(qf.id)}
              style={{
                padding: '4px 8px',
                borderRadius: '8px',
                border: isSel ? '1px solid #0F172A' : '1px solid #E2E8F0',
                background: isSel ? '#0F172A' : '#FFFFFF',
                color: isSel ? '#FFFFFF' : '#475569',
                fontSize: '10.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.12s ease'
              }}
            >
              <Icon size={11} />
              <span>{qf.label}</span>
              <span style={{ opacity: 0.75 }}>{qf.count}</span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          overflowY: 'auto',
          paddingLeft: '2px',
          scrollbarWidth: 'thin'
        }}
      >
        {displayedQueue.length === 0 && (
          <span style={{ fontSize: '11px', color: '#94A3B8', padding: '8px 2px' }}>
            لا يوجد مشترك في هذه القائمة.
          </span>
        )}

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
            <button
              key={client.id || client.client_code}
              type="button"
              onClick={() => handleSelectClient(client.client_code || client.id)}
              style={{
                width: '100%',
                textAlign: 'right',
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {client.full_name || client.name}
                </strong>
                <span
                  dir="ltr"
                  style={{
                    fontSize: '9.5px',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                    color: isSelected ? '#FFFFFF' : '#475569'
                  }}
                >
                  #{String(client.client_code || client.id || '').replace(/^#+/, '')}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
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
            </button>
          );
        })}

        {filteredQueue.length > displayedQueue.length && (
          <span style={{ fontSize: '10.5px', color: '#64748B', padding: '6px 2px', textAlign: 'center' }}>
            + {filteredQueue.length - displayedQueue.length} مشترك آخر (اكتب الاسم في البحث)
          </span>
        )}
      </div>
    </div>
  );
}
