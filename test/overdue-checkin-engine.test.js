import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateClientCheckinOverdue,
  filterOverdueClients,
  generateOverdueWhatsAppNudge
} from '../src/execution-engines/overdue-checkin-engine.js';

test('Overdue Check-in & Ghosting Nudge Engine Suite', async (suite) => {
  const mockNow = new Date('2026-09-16T12:00:00Z');

  await suite.test('1. Client on track (last check-in 5 days ago) is NOT overdue', () => {
    const client = {
      id: 101,
      client_code: '101',
      full_name: 'أحمد محمود',
      status: 'ACTIVE',
      checkinSubmissions: [
        { id: 1, created_at: '2026-09-11T10:00:00Z' } // 5 days ago
      ]
    };

    const res = evaluateClientCheckinOverdue(client, mockNow);
    assert.equal(res.isOverdue, false);
    assert.equal(res.daysElapsed, 5);
    assert.equal(res.daysOverdue, 0);
  });

  await suite.test('2. Client overdue by 3 days (10 days elapsed) triggers overdue alert', () => {
    const client = {
      id: 102,
      client_code: '102',
      full_name: 'كريم عادل',
      status: 'ACTIVE',
      checkinSubmissions: [
        { id: 1, created_at: '2026-09-06T10:00:00Z' } // 10 days ago (3 days overdue)
      ]
    };

    const res = evaluateClientCheckinOverdue(client, mockNow);
    assert.equal(res.isOverdue, true);
    assert.equal(res.daysElapsed, 10);
    assert.equal(res.daysOverdue, 3);
    assert.equal(res.urgency, 'MODERATE');
  });

  await suite.test('3. Client ghosting for 16 days triggers CRITICAL overdue urgency', () => {
    const client = {
      id: 103,
      client_code: '103',
      full_name: 'محمد إبراهيم',
      status: 'ACTIVE',
      checkinSubmissions: [
        { id: 1, created_at: '2026-08-31T10:00:00Z' } // 16 days ago (9 days overdue)
      ]
    };

    const res = evaluateClientCheckinOverdue(client, mockNow);
    assert.equal(res.isOverdue, true);
    assert.equal(res.daysOverdue, 9);
    assert.equal(res.urgency, 'CRITICAL');
  });

  await suite.test('4. Inactive or expired clients are NOT flagged as overdue', () => {
    const client = {
      id: 104,
      status: 'EXPIRED',
      checkinSubmissions: [
        { id: 1, created_at: '2026-08-01T10:00:00Z' }
      ]
    };

    const res = evaluateClientCheckinOverdue(client, mockNow);
    assert.equal(res.isOverdue, false);
    assert.equal(res.reason, 'CLIENT_NOT_ACTIVE');
  });

  await suite.test('5. generateOverdueWhatsAppNudge produces polite Egyptian Arabic nudge with checkin link', () => {
    const client = {
      client_code: '102',
      full_name: 'كريم عادل'
    };

    const msg = generateOverdueWhatsAppNudge(client, 'https://z-coaching.com');
    assert.ok(msg.includes('صباح الفل يا كريم عادل'));
    assert.ok(msg.includes('مستنيين شيك إنك وصورك'));
    assert.ok(msg.includes('https://z-coaching.com/checkin?code=102'));
    assert.ok(!/[\u{1F300}-\u{1F6FF}]/u.test(msg)); // Zero emojis
  });

  await suite.test('6. filterOverdueClients ranks by most overdue first', () => {
    const clients = [
      { id: 1, client_code: '1', status: 'ACTIVE', checkinSubmissions: [{ created_at: '2026-09-06T10:00:00Z' }] }, // 3 days overdue
      { id: 2, client_code: '2', status: 'ACTIVE', checkinSubmissions: [{ created_at: '2026-08-31T10:00:00Z' }] }, // 9 days overdue
      { id: 3, client_code: '3', status: 'ACTIVE', checkinSubmissions: [{ created_at: '2026-09-12T10:00:00Z' }] }, // 4 days ago -> not overdue
    ];

    const overdue = filterOverdueClients(clients, mockNow);
    assert.equal(overdue.length, 2);
    assert.equal(overdue[0].client.id, 2); // 9 days overdue comes first
    assert.equal(overdue[1].client.id, 1);
  });
});
