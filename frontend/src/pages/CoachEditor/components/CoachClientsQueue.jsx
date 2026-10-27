import React from 'react';
import { Users, AlertCircle, Clock, RotateCw, ShieldAlert } from 'lucide-react';
import { TableSearch } from '@/shared/components/table-search';
import { ClientCodeBadge, ClientPackageBadge, getClientTier } from '../../../utils/tierBadgeHelper';

function parseAnswers(answers) {
  if (!answers) return null;
  if (typeof answers === 'object') return answers;
  if (typeof answers === 'string') {
    try { return JSON.parse(answers); } catch { return null; }
  }
  return null;
}

function getCleanGoalLabel(client, program) {
  if (!client) return '';
  const answers = parseAnswers(client.answers);
  const intakeAnswers = parseAnswers(client.intakeSubmissions?.[0]?.answers);
  const isSelectedClient = (client.id && program?.client?.id && String(client.id) === String(program.client.id)) ||
    (client.client_code && program?.client?.client_code && String(client.client_code) === String(program.client.client_code));
  const raw = client.goal_label || client.goal || client.primary_goal || client.program_goal || client.fitness_goal ||
              answers?.goals?.primary || answers?.primary_goal || answers?.goal ||
              intakeAnswers?.goals?.primary || intakeAnswers?.primary_goal ||
              (isSelectedClient ? (program.client.goal_label || program.client.primary_goal || program.client.goal) : '') || '';
  if (!raw) return '';
  const s = String(raw).trim();
  if (/fat_loss|خسارة دهون|تنشيف|حرق|loss/i.test(s)) return 'خسارة دهون وتنشيف';
  if (/lean_bulk|bulk|تضخيم|بناء عضلي|زيادة وزن/i.test(s)) return 'بناء عضلي صافي';
  if (/recomp|إعادة تشكيل|تحسين قوام/i.test(s)) return 'إعادة تشكيل وتنسيق';
  if (/strength|قوة/i.test(s)) return 'زيادة القوة البدنية';
  if (/endurance|لياقة/i.test(s)) return 'رفع اللياقة والتحمل';
  return s.replace(/\s*\([^)]*\)/g, '').trim();
}

function getCleanInjury(client) {
  const injuries = Array.isArray(client.injuries) ? client.injuries : [];
  for (const inj of injuries) {
    const s = typeof inj === 'string' ? inj : (inj?.name || inj?.area || inj?.conditionCode || '');
    if (s && !/سليم|لا توجد|متابعة اعتيادية|لا يوجد|none/i.test(s)) {
      return s.replace(/\s*\([^)]*\)/g, '').trim();
    }
  }
  return null;
}

/**
 * The coach's client list - Unified list view identical to WhatsApp Hub & Check-in Review.
 */
export function CoachClientsQueue({
  urgentCount,
  pendingPlanCount,
  needsUpdateCount,
  clientsList = [],
  queueFilter,
  setQueueFilter,
  queueTierFilter = 'ALL',
  setQueueTierFilter,
  queueSearch,
  setQueueSearch,
  displayedQueue = [],
  filteredQueue = [],
  program,
  clientCodeParam,
  handleSelectClient
}) {
  const filters = [
    { id: 'ALL', label: 'الكل', icon: Users, count: clientsList.length },
    { id: 'ACTION_NEEDED', label: 'مطلوب إجراء', icon: AlertCircle, count: urgentCount },
    { id: 'PENDING_PLAN', label: 'بانتظار خطة', icon: Clock, count: pendingPlanCount },
    { id: 'NEEDS_UPDATE', label: 'مطلوب تعديل', icon: RotateCw, count: needsUpdateCount }
  ];

  const maxCount = clientsList.filter(c => getClientTier(c) === 'MAX').length;
  const eliteCount = clientsList.filter(c => getClientTier(c) !== 'MAX').length;

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #EAECF0',
        borderRadius: '24px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
        height: '100%',
        maxHeight: '100%',
        boxSizing: 'border-box',
        overscrollBehavior: 'contain'
      }}
      dir="rtl"
    >
      {/* Top Header & Search Area */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid #EAECF0',
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="#673DE6" />
            <strong style={{ fontSize: '13px', color: '#101828', fontWeight: 700 }}>المشتركون</strong>
            <span style={{ fontSize: '11px', color: '#667085', fontWeight: 600 }}>({filteredQueue.length})</span>
          </div>
        </div>

        <TableSearch
          value={queueSearch}
          onChange={setQueueSearch}
          placeholder="ابحث بالاسم أو الكود"
          width="100%"
        />

        {/* Operational Filter Tabs (2x2 Grid) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', width: '100%' }}>
          {filters.map((qf) => {
            const Icon = qf.icon;
            const isSel = queueFilter === qf.id && (qf.id !== 'ALL' || queueTierFilter === 'ALL');
            return (
              <button
                key={qf.id}
                type="button"
                onClick={() => {
                  setQueueFilter(qf.id);
                  if (qf.id === 'ALL') {
                    setQueueTierFilter?.('ALL');
                  }
                }}
                style={{
                  width: '100%',
                  height: '32px',
                  padding: '0 8px',
                  borderRadius: '9999px',
                  border: isSel ? '1px solid #673DE6' : '1px solid #E2E8F0',
                  background: isSel ? '#673DE6' : '#FFFFFF',
                  color: isSel ? '#FFFFFF' : '#344054',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  boxShadow: isSel ? '0 1px 2px rgba(103, 61, 230, 0.15)' : 'none',
                  transition: 'all 0.12s ease',
                  boxSizing: 'border-box'
                }}
              >
                <Icon size={13} strokeWidth={2.4} />
                <span style={{ fontWeight: 700 }}>{qf.label}</span>
                <span style={{ opacity: isSel ? 0.95 : 0.8, fontFamily: 'JetBrains Mono, Cairo, monospace', fontSize: '10.5px', fontWeight: 700 }}>({qf.count})</span>
              </button>
            );
          })}
        </div>

        {/* Tier Package Filters (MAX / ELITE) - Underneath Status Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', width: '100%' }}>
          <button
            type="button"
            onClick={() => setQueueTierFilter?.(prev => prev === 'MAX' ? 'ALL' : 'MAX')}
            style={{
              width: '100%',
              height: '32px',
              padding: '0 8px',
              borderRadius: '9999px',
              border: queueTierFilter === 'MAX' ? '1.5px solid #B45309' : '1px solid #E2E8F0',
              background: queueTierFilter === 'MAX' ? '#FFFDF5' : '#FFFFFF',
              color: '#B45309',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              boxShadow: queueTierFilter === 'MAX' ? '0 1px 3px rgba(180, 83, 9, 0.15)' : 'none',
              transition: 'all 0.12s ease',
              boxSizing: 'border-box'
            }}
          >
            <span style={{ fontWeight: 800 }}>باقة MAX</span>
            <span style={{ fontFamily: 'JetBrains Mono, Cairo, monospace', fontSize: '10.5px', opacity: 0.9, fontWeight: 800 }}>
              ({maxCount})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setQueueTierFilter?.(prev => prev === 'ELITE' ? 'ALL' : 'ELITE')}
            style={{
              width: '100%',
              height: '32px',
              padding: '0 8px',
              borderRadius: '9999px',
              border: queueTierFilter === 'ELITE' ? '1.5px solid #0284C7' : '1px solid #E2E8F0',
              background: queueTierFilter === 'ELITE' ? '#F0F9FF' : '#FFFFFF',
              color: '#0284C7',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              boxShadow: queueTierFilter === 'ELITE' ? '0 1px 3px rgba(2, 132, 199, 0.15)' : 'none',
              transition: 'all 0.12s ease',
              boxSizing: 'border-box'
            }}
          >
            <span style={{ fontWeight: 800 }}>باقة ELITE</span>
            <span style={{ fontFamily: 'JetBrains Mono, Cairo, monospace', fontSize: '10.5px', opacity: 0.9, fontWeight: 800 }}>
              ({eliteCount})
            </span>
          </button>
        </div>
      </div>

      {/* Clients Continuous Table Feed */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 0%',
          minHeight: 0,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          scrollbarWidth: 'thin',
          padding: '6px'
        }}
      >
        {displayedQueue.length === 0 && (
          <span style={{ fontSize: '11.5px', color: '#667085', padding: '24px 12px', textAlign: 'center' }}>
            لا يوجد مشترك في هذه القائمة.
          </span>
        )}

        {displayedQueue.map((client) => {
          const isSelected = (client.id && program?.client?.id && String(client.id) === String(program.client.id)) || 
            (client.client_code && String(client.client_code) === String(program?.client?.client_code || clientCodeParam));
          const isPending = client.queue_status === 'PENDING_PLAN';
          const isNeedsUpdate = client.queue_status === 'NEEDS_UPDATE';
          const goalText = getCleanGoalLabel(client, program);
          const injuryText = getCleanInjury(client);
          const rawClientName = client.full_name || client.name || '';
          const isSimulated = String(client.client_code || client.id).startsWith('JRN_') || rawClientName.includes(' - ');
          let clientDisplayName = rawClientName;
          let clientSubscenario = null;
          if (isSimulated && rawClientName.includes(' - ')) {
            const parts = rawClientName.split(' - ');
            clientDisplayName = parts[0].trim();
            clientSubscenario = parts.slice(1).join(' - ').trim();
          }

          const hasRow2 = Boolean(clientSubscenario || goalText || injuryText || isPending || isNeedsUpdate);

          return (
            <div
              key={client.id || client.client_code}
              onClick={() => handleSelectClient(client.client_code || client.id)}
              title={clientDisplayName}
              style={{
                padding: hasRow2 ? '7px 10px' : '6px 10px',
                borderRadius: '9999px',
                marginBottom: '4px',
                background: isSelected ? '#F9F5FF' : '#FFFFFF',
                border: isSelected ? '1px solid #D6BBFB' : '1px solid #F1F5F9',
                borderRight: isSelected ? '3.5px solid #673DE6' : '3.5px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: hasRow2 ? '4px' : '0px',
                transition: 'all 0.12s ease',
                width: '100%',
                boxSizing: 'border-box',
                boxShadow: isSelected ? '0 1px 3px rgba(103, 61, 230, 0.08)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = '#F8FAFC';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#F1F5F9';
                }
              }}
            >
              {/* Row 1: Code + Name on right, Package Badge strictly pinned on left */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                  <ClientCodeBadge code={client.client_code || client.id} item={client} size="sm" />
                  <strong style={{
                    fontSize: '12.5px',
                    color: isSelected ? '#673DE6' : '#0F172A',
                    fontWeight: isSelected ? 800 : 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {client.full_name || client.name}
                  </strong>
                </div>

                <div style={{ flexShrink: 0 }}>
                  <ClientPackageBadge item={client} size="xs" />
                </div>
              </div>

              {/* Row 2: Important Info Only (Goal • Injury Alert | Action Status) - Flexibly lifted when no extra info exists */}
              {hasRow2 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                    {clientSubscenario && (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 600,
                        padding: '1px 5px',
                        borderRadius: '9999px',
                        background: '#F2F4F7',
                        color: '#475467',
                        flexShrink: 0
                      }}>
                        {clientSubscenario}
                      </span>
                    )}
                    {goalText && (
                      <span style={{
                        fontSize: '10.5px',
                        color: isSelected ? '#7C3AED' : '#64748B',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {goalText}
                      </span>
                    )}

                    {injuryText && (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '9999px',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        color: '#DC2626',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                        flexShrink: 0
                      }}>
                        <ShieldAlert size={9} strokeWidth={2.4} />
                        <span style={{ maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {injuryText}
                        </span>
                      </span>
                    )}
                  </div>

                  {(isPending || isNeedsUpdate) && (
                    <div style={{ flexShrink: 0 }}>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '1.5px 6.5px',
                        borderRadius: '9999px',
                        background: isPending ? '#FFFAEB' : '#EFF8FF',
                        border: `1px solid ${isPending ? '#FEDF89' : '#B2DDFF'}`,
                        color: isPending ? '#B54708' : '#175CD3',
                        whiteSpace: 'nowrap'
                      }}>
                        {isPending ? 'بانتظار خطة' : 'مطلوب تعديل'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredQueue.length > displayedQueue.length && (
          <span style={{ fontSize: '11px', color: '#667085', padding: '8px 4px', textAlign: 'center', background: '#F8FAFC' }}>
            + {filteredQueue.length - displayedQueue.length} مشترك آخر (اكتب الاسم في البحث)
          </span>
        )}
      </div>
    </div>
  );
}
