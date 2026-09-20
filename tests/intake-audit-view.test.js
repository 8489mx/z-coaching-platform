import { describe, it, expect, vi } from 'vitest';
import React from '../frontend/node_modules/react/index.js';
import { renderToStaticMarkup } from '../frontend/node_modules/react-dom/server.node.js';
import IntakeAuditDetailModal from '../frontend/src/components/intake/IntakeAuditDetailModal.jsx';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}));

describe('IntakeAuditDetailModal Guard', () => {
  it('translates known codes to Arabic strictly without exposing raw keys', () => {
    // Exact keys requested by the user
    const submission = { 
      id: 'test-123', 
      user: { full_name: 'Test' }, 
      answers: {
        primary_goal: 'recomposition',
        neat_level: 'moderate',
        training_environment: 'commercial_gym',
        training_logistics: {
          experience_level: 'intermediate',
          days_per_week: 4
        },
        recent_training: 'ACTIVE',
        meal_structure: {
          meals_count: '3_meals_snack',
          intermittent_fasting: 'none'
        },
        food_budget: 'LOW',
        food_prep_ability: 'FULL_KITCHEN',
        beverage_sugar_intake: 'zero_or_sweetener',
        sleep_schedule: {
          pattern: 'regular_night',
          average_hours: '7_8',
          bedtime_hour: '23:00'
        },
        religion: 'MUSLIM',
        christianFastingStyle: 'PESCATARIAN_ALLOWED',
        strict_allergies: ['gluten_celiac'],
        medical_conditions: {
          selected: ['diabetes', 'gout'],
          diabetes: { type: 'type2' },
          bariatric: { meal_capacity_grams: '150_200' }
        },
        injuries_map: {
          injury_nature: 'chronic',
          selected_areas: ['knee']
        },
        focus_muscles: ['arms', 'side_delts'],
        current_meds_supplements_list: ['creatine', 'whey_protein']
      }
    };

    const html = renderToStaticMarkup(
      React.createElement(IntakeAuditDetailModal, { submission, onClose: () => {} })
    );

    const forbiddenRawKeys = [
      'recomposition', 'moderate', 'MUSLIM', 'PESCATARIAN_ALLOWED', 'gluten_celiac',
      '3_meals_snack', 'FULL_KITCHEN', 'regular_night', 'intermediate', 'ACTIVE',
      'arms', 'side_delts', 'knee', 'chronic', 'diabetes', 'gout', 'type2'
    ];

    for (const key of forbiddenRawKeys) {
      if (html.includes(key)) {
        throw new Error(`Forbidden raw key appeared in output: ${key}`);
      }
    }
  });

  it('renders unknown codes as-is and empty fields as "لم يُجب"', () => {
    const submission = { 
      id: 'test-456', 
      user: { full_name: 'Test' }, 
      answers: {
        primary_goal: 'something_else',
        neat_level: '',
        occupation_type: null
      } 
    };

    const html = renderToStaticMarkup(
      React.createElement(IntakeAuditDetailModal, { submission, onClose: () => {} })
    );

    if (!html.includes('something_else')) {
      throw new Error('Unknown code "something_else" was hidden or mutated.');
    }

    if (!html.includes('لم يُجب')) {
      throw new Error('Empty fields did not render as "لم يُجب".');
    }
  });
});
