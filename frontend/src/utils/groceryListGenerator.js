/**
 * Smart Supermarket Grocery List Aggregator & Classifier
 * Aggregates a client's daily culinary meal plan into weekly shopping list items,
 * categorized into supermarket aisles with checkboxes and smart unit conversions.
 */

export function generateSmartGroceryList(culinaryMeals = [], daysMultiplier = 7) {
  if (!Array.isArray(culinaryMeals) || culinaryMeals.length === 0) {
    return [];
  }

  const categoryMap = {
    MEAT_POULTRY_FISH: {
      id: 'MEAT_POULTRY_FISH',
      title_ar: 'قسم اللحوم والدواجن والأسماك الطازجة',
      icon: 'ti-meat',
      badge_color: '#EF4444',
      badge_bg: '#FEE2E2',
      items: {}
    },
    GRAINS_CARBS: {
      id: 'GRAINS_CARBS',
      title_ar: 'قسم البقالة والحبوب والنشويات المعقدة',
      icon: 'ti-grain',
      badge_color: '#D97706',
      badge_bg: '#FEF3C7',
      items: {}
    },
    DAIRY_EGGS: {
      id: 'DAIRY_EGGS',
      title_ar: 'قسم الألبان والأجبان والبيض',
      icon: 'ti-cheese',
      badge_color: '#0284C7',
      badge_bg: '#E0F2FE',
      items: {}
    },
    PRODUCE_HEALTHY_FATS: {
      id: 'PRODUCE_HEALTHY_FATS',
      title_ar: 'قسم الخضروات والفاكهة والدهون الصحية',
      icon: 'ti-leaf',
      badge_color: '#10B981',
      badge_bg: '#ECFDF5',
      items: {}
    },
    PANTRY_EXTRAS: {
      id: 'PANTRY_EXTRAS',
      title_ar: 'قسم المكملات والمشروبات والمكونات المجانية',
      icon: 'ti-bottle',
      badge_color: '#8B5CF6',
      badge_bg: '#EDE9FE',
      items: {}
    }
  };

  culinaryMeals.forEach((meal) => {
    (meal.items || []).forEach((item) => {
      const code = (item.food_code || item.food_id || item.name_en || item.name_ar || '').toUpperCase();
      const nameAr = item.name_ar || item.food_name || item.name_en || 'صنف غذائي';
      const unit = item.unit || item.serving_unit || 'جم';
      const rawGrams = Number(item.amount_g || item.weight_g || item.quantity || 0);
      const isCountable = unit === 'بيضة' || unit === 'حبة' || unit === 'رغيف' || unit === 'سكوب';

      // Categorize item
      let targetCat = 'GRAINS_CARBS';

      if (code.includes('CHICKEN') || code.includes('MEAT') || code.includes('BEEF') || code.includes('FISH') || code.includes('TUNA') || code.includes('SALMON') || code.includes('SHRIMP') || code.includes('TURKEY') || nameAr.includes('دجاج') || nameAr.includes('لحم') || nameAr.includes('سمك') || nameAr.includes('تونة') || nameAr.includes('كفتة') || nameAr.includes('حاشي')) {
        targetCat = 'MEAT_POULTRY_FISH';
      } else if (code.includes('EGG') || code.includes('COTTAGE') || code.includes('MILK') || code.includes('YOGURT') || code.includes('CHEESE') || code.includes('WHEY') || nameAr.includes('بيض') || nameAr.includes('قريش') || nameAr.includes('جبن') || nameAr.includes('زبادي') || nameAr.includes('لبن') || nameAr.includes('حليب')) {
        targetCat = 'DAIRY_EGGS';
      } else if (code.includes('OIL') || code.includes('OLIVE') || code.includes('AVOCADO') || code.includes('NUT') || code.includes('PEANUT') || code.includes('VEG') || code.includes('SALAD') || code.includes('TOMATO') || code.includes('CUCUMBER') || code.includes('APPLE') || code.includes('BANANA') || code.includes('BERRY') || nameAr.includes('زيت') || nameAr.includes('أفوكادو') || nameAr.includes('مكسرات') || nameAr.includes('سوداني') || nameAr.includes('خضار') || nameAr.includes('سلطة') || nameAr.includes('تفاح') || nameAr.includes('موز') || nameAr.includes('طماطم') || nameAr.includes('خيار')) {
        targetCat = 'PRODUCE_HEALTHY_FATS';
      } else if (code.includes('PROTEIN_POWDER') || code.includes('CREATINE') || code.includes('COFFEE') || code.includes('TEA') || nameAr.includes('بروتين') || nameAr.includes('قهوة') || nameAr.includes('شاي') || nameAr.includes('بهارات')) {
        targetCat = 'PANTRY_EXTRAS';
      }

      if (!categoryMap[targetCat].items[nameAr]) {
        categoryMap[targetCat].items[nameAr] = {
          name_ar: nameAr,
          food_code: code,
          unit: unit,
          is_countable: isCountable,
          daily_amount: 0,
          weekly_amount: 0,
        };
      }

      categoryMap[targetCat].items[nameAr].daily_amount += rawGrams;
      categoryMap[targetCat].items[nameAr].weekly_amount += rawGrams * daysMultiplier;
    });
  });

  // Convert map to formatted array
  return Object.values(categoryMap)
    .map(cat => ({
      ...cat,
      items: Object.values(cat.items).map(item => {
        let displayWeekly = '';
        if (item.unit === 'جم' || item.unit === 'g') {
          if (item.weekly_amount >= 1000) {
            displayWeekly = `${(item.weekly_amount / 1000).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')} كجم`;
          } else {
            displayWeekly = `${Math.round(item.weekly_amount)} جم`;
          }
        } else {
          displayWeekly = `${Math.round(item.weekly_amount)} ${item.unit}`;
        }

        const displayDaily = `${Math.round(item.daily_amount)} ${item.unit}/يوم`;

        return {
          ...item,
          display_weekly: displayWeekly,
          display_daily: displayDaily,
        };
      })
    }))
    .filter(cat => cat.items.length > 0);
}
