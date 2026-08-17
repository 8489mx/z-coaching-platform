import React from 'react';

export default function Step4Nutrition({
  formData,
  updateField,
  addArrayItem,
  updateArrayItem,
  removeArrayItem
}) {
  return (
    <div className="step-content">
      <h3 className="section-title">الخيارات المفضلة للوجبات</h3>
      <div className="grid-2-col">
        <div className="form-group">
          <label className="form-label">عدد الوجبات المفضل يومياً</label>
          <div className="choices-grid">
            {[2, 3, 4, 5, 6].map(count => (
              <div 
                key={count} 
                className={`choice-pill ${formData.nutrition.preferredMealCount === count ? 'selected' : ''}`} 
                onClick={() => updateField('nutrition', 'preferredMealCount', count)}
              >
                <div className="choice-title">{count} وجبات</div>
              </div>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">الميزانية المتوفرة للدايت</label>
          <select 
            className="form-control" 
            value={formData.nutrition.budget} 
            onChange={e => updateField('nutrition', 'budget', e.target.value)}
          >
            <option value="LOW">اقتصادية (Low)</option>
            <option value="MEDIUM">متوسطة (Medium)</option>
            <option value="HIGH">عالية (High)</option>
            <option value="UNLIMITED">مفتوحة (Unlimited)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">هل تمتلك ثلاجة لتخزين الأكل؟</label>
          <select 
            className="form-control" 
            value={String(formData.nutrition.foodStorageAvailable)} 
            onChange={e => updateField('nutrition', 'foodStorageAvailable', e.target.value === 'true')}
          >
            <option value="true">نعم</option>
            <option value="false">لا</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">هل تمتلك وسيلة تسخين (ميكروويف/بوتاجاز) في مكان العمل؟</label>
          <select 
            className="form-control" 
            value={String(formData.nutrition.foodReheatingAvailable)} 
            onChange={e => updateField('nutrition', 'foodReheatingAvailable', e.target.value === 'true')}
          >
            <option value="true">نعم</option>
            <option value="false">لا</option>
          </select>
        </div>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">حساسية الطعام والممنوعات (Allergies)</h3>
      <div className="array-builder">
        {formData.nutrition.allergies.map((allergy, idx) => (
          <div key={idx} className="array-item">
            <button type="button" className="btn-remove" onClick={() => removeArrayItem('nutrition', 'allergies', idx)}>
              <i className="bi bi-trash"></i>
            </button>
            <div className="grid-2-col" style={{ width: '100%' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">المادة أو الصنف</label>
                <select className="form-control" value={allergy.substance} onChange={e => updateArrayItem('nutrition', 'allergies', idx, 'substance', e.target.value)}>
                  <option value="DAIRY">الحليب ومشتقات الألبان (Milk & Dairy)</option>
                  <option value="EGGS">البيض (Eggs)</option>
                  <option value="PEANUTS">الفول السوداني (Peanuts)</option>
                  <option value="TREE_NUTS">المكسرات الشجرية (كاجو، لوز، جوز، فستق، بندق)</option>
                  <option value="SEAFOOD">المأكولات البحرية والأسماك (Fish & Seafood)</option>
                  <option value="SHELLFISH">القشريات والصدفيات (جمبري، إستاكوزا، كابوريا)</option>
                  <option value="GLUTEN">الجلوتين وحساسية القمح (Gluten & Wheat)</option>
                  <option value="SOY">الصويا ومشتقات الصويا (Soy & Soybeans)</option>
                  <option value="SESAME">السمسم والطحينة (Sesame & Tahini)</option>
                  <option value="LEGUMES">البقوليات (الفول، العدس، الحمص)</option>
                  <option value="STRAWBERRY">الفراولة والتوتيات (Strawberries & Berries)</option>
                  <option value="CITRUS">الحمضيات والموالح (برتقال، ليمون، جريب فروت)</option>
                  <option value="CORN">الذرة ومنتجات الذرة (Corn)</option>
                  <option value="SULFITES">الكبريتات والمواد الحافظة (Sulfites)</option>
                  <option value="BANANA">الموز (Banana)</option>
                  <option value="CHOCOLATE">الشوكولاتة والكاكاو (Chocolate & Cocoa)</option>
                  <option value="OTHER">حساسية صنف آخر</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">هل هي حساسية مشخصة طبياً؟</label>
                <select className="form-control" value={String(allergy.medicallyConfirmed)} onChange={e => updateArrayItem('nutrition', 'allergies', idx, 'medicallyConfirmed', e.target.value === 'true')}>
                  <option value="true">نعم، تم تشخيصها طبياً</option>
                  <option value="false">لا، مجرد شك أو تجنب شخصي</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="btn-add-outline" onClick={() => addArrayItem('nutrition', 'allergies', { substance: 'DAIRY', medicallyConfirmed: true })}>
          + إضافة حساسية طعام
        </button>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">عدم تحمل الطعام (Intolerances)</h3>
      <div className="array-builder">
        {formData.nutrition.intolerances.map((intol, idx) => (
          <div key={idx} className="array-item">
            <button type="button" className="btn-remove" onClick={() => removeArrayItem('nutrition', 'intolerances', idx)}>
              <i className="bi bi-trash"></i>
            </button>
            <div className="grid-2-col" style={{ width: '100%' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">الصنف أو المادة</label>
                <select className="form-control" value={intol.substance} onChange={e => updateArrayItem('nutrition', 'intolerances', idx, 'substance', e.target.value)}>
                  <option value="LACTOSE">سكر الحليب واللاكتوز (Lactose Intolerance)</option>
                  <option value="GLUTEN">حساسية الجلوتين غير السيلياك (Non-Celiac Gluten)</option>
                  <option value="FRUCTOSE">سكر الفواكه والفركتوز (Fructose Malabsorption)</option>
                  <option value="FODMAP">أطعمة الفودماب والسكريات المخمرة (FODMAPs)</option>
                  <option value="HISTAMINE">الهيستامين والأطعمة المعتقة (Histamine)</option>
                  <option value="CAFFEINE">الكافيين والمنبهات (Caffeine Sensitivity)</option>
                  <option value="SPICY_FOODS">الأطعمة الحارة والبهارات الشديدة (Spicy Foods)</option>
                  <option value="ARTIFICIAL_SWEETENERS">المحليات الصناعية وسكر الكحول (Sweeteners)</option>
                  <option value="EGGS_INTOLERANCE">صفار أو بياض البيض (Egg Intolerance)</option>
                  <option value="YEAST">الخمائر ومنتجات التخمير (Yeast)</option>
                  <option value="SULFITES">الكبريتات والمجففات (Sulfites)</option>
                  <option value="OTHER">عدم تحمل صنف آخر</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">الحدة (Severity)</label>
                <select className="form-control" value={intol.severity} onChange={e => updateArrayItem('nutrition', 'intolerances', idx, 'severity', e.target.value)}>
                  <option value="MILD">خفيفة (MILD)</option>
                  <option value="MODERATE">متوسطة (MODERATE)</option>
                  <option value="SEVERE">شديدة (SEVERE)</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">هل تم التشخيص طبياً؟</label>
                <select className="form-control" value={String(intol.medicallyDiagnosed)} onChange={e => updateArrayItem('nutrition', 'intolerances', idx, 'medicallyDiagnosed', e.target.value === 'true')}>
                  <option value="true">نعم</option>
                  <option value="false">لا</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">ملاحظات إضافية</label>
                <input type="text" className="form-control" value={intol.notes || ''} onChange={e => updateArrayItem('nutrition', 'intolerances', idx, 'notes', e.target.value)} placeholder="مثال: يسبب لي انتفاخ شديد أو مغص" />
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="btn-add-outline" onClick={() => addArrayItem('nutrition', 'intolerances', { substance: 'LACTOSE', severity: 'MILD', medicallyDiagnosed: false, notes: '' })}>
          + إضافة عدم تحمل طعام
        </button>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">مشاكل واضطرابات الهضم (Digestive Issues)</h3>
      <div className="array-builder">
        {formData.nutrition.digestiveIssues.map((issue, idx) => (
          <div key={idx} className="array-item">
            <button type="button" className="btn-remove" onClick={() => removeArrayItem('nutrition', 'digestiveIssues', idx)}>
              <i className="bi bi-trash"></i>
            </button>
            <div className="grid-2-col" style={{ width: '100%' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">المشكلة أو الاضطراب</label>
                <select className="form-control" value={issue.name} onChange={e => updateArrayItem('nutrition', 'digestiveIssues', idx, 'name', e.target.value)}>
                  <option value="BLOATING">انتفاخ وغازات متكررة (Bloating & Gas)</option>
                  <option value="ACID_REFLUX">حموضة وحرقان المعدة وارتجاع مريء (Acid Reflux / GERD)</option>
                  <option value="IBS">متلازمة القولون العصبي (Irritable Bowel Syndrome - IBS)</option>
                  <option value="CONSTIPATION">إمساك مزمن وصعوبة إخراج (Chronic Constipation)</option>
                  <option value="DIARRHEA">إسهال متكرر أو براز رخو (Frequent Diarrhea)</option>
                  <option value="INDIGESTION">عسر هضم وبطء تفريغ المعدة (Dyspepsia / Indigestion)</option>
                  <option value="STOMACH_ULCER">التهاب أو قرحة المعدة (Gastritis / Stomach Ulcer)</option>
                  <option value="FAT_MALABSORPTION">كسل المرارة أو صعوبة هضم الدهون (Fat Malabsorption)</option>
                  <option value="STOMACH_CRAMPS">تقلصات ومغص متكرر في البطن (Abdominal Cramps)</option>
                  <option value="OTHER">اضطراب هضمي آخر</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">الحدة (Severity)</label>
                <select className="form-control" value={issue.severity} onChange={e => updateArrayItem('nutrition', 'digestiveIssues', idx, 'severity', e.target.value)}>
                  <option value="MILD">خفيفة (MILD)</option>
                  <option value="MODERATE">متوسطة (MODERATE)</option>
                  <option value="SEVERE">شديدة (SEVERE)</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="btn-add-outline" onClick={() => addArrayItem('nutrition', 'digestiveIssues', { name: 'BLOATING', severity: 'MILD' })}>
          + إضافة مشكلة هضم
        </button>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">الأطعمة المكروهة أو المستبعدة</h3>
      <div className="form-group">
        <label className="form-label">أطعمة لا تفضلها (Disliked Foods)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {(formData.nutrition.dislikedFoods || []).map((food, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <input type="text" className="form-control" style={{ border: 'none', background: 'transparent', width: '150px', padding: '0' }} value={food} onChange={e => {
                const newFoods = [...(formData.nutrition.dislikedFoods || [])];
                newFoods[idx] = e.target.value;
                updateField('nutrition', 'dislikedFoods', newFoods);
              }} placeholder="اسم الطعام" />
              <button type="button" className="btn btn-sm btn-danger ms-2" style={{ padding: '0.1rem 0.4rem' }} onClick={() => {
                const newFoods = [...(formData.nutrition.dislikedFoods || [])];
                newFoods.splice(idx, 1);
                updateField('nutrition', 'dislikedFoods', newFoods);
              }}><i className="bi bi-x"></i></button>
            </div>
          ))}
          <button type="button" className="btn-add-outline" style={{ padding: '0.5rem', marginTop: '0' }} onClick={() => {
            const newFoods = [...(formData.nutrition.dislikedFoods || []), ''];
            updateField('nutrition', 'dislikedFoods', newFoods);
          }}>+ إضافة طعام</button>
        </div>
      </div>

      <div className="section-divider"></div>
      <h3 className="section-title">أوقات الصيام أو منع الأكل</h3>
      <div className="form-group">
        <label className="form-label">إذا كنت تصوم أو لديك أوقات لا تستطيع الأكل فيها، أضفها هنا</label>
        {(formData.nutrition.unavailableEatingWindows || []).map((window, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>من الساعة</label>
              <input type="time" className="form-control" value={window.start} onChange={e => {
                const newWin = [...(formData.nutrition.unavailableEatingWindows || [])];
                newWin[idx] = { ...newWin[idx], start: e.target.value };
                updateField('nutrition', 'unavailableEatingWindows', newWin);
              }} />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>إلى الساعة</label>
              <input type="time" className="form-control" value={window.end} onChange={e => {
                const newWin = [...(formData.nutrition.unavailableEatingWindows || [])];
                newWin[idx] = { ...newWin[idx], end: e.target.value };
                updateField('nutrition', 'unavailableEatingWindows', newWin);
              }} />
            </div>
            <button type="button" className="btn btn-danger mt-4" onClick={() => {
              const newWin = [...(formData.nutrition.unavailableEatingWindows || [])];
              newWin.splice(idx, 1);
              updateField('nutrition', 'unavailableEatingWindows', newWin);
            }}><i className="bi bi-trash"></i> حذف</button>
          </div>
        ))}
        <button type="button" className="btn-add-outline" onClick={() => {
          const newWin = [...(formData.nutrition.unavailableEatingWindows || []), { start: '09:00', end: '12:00' }];
          updateField('nutrition', 'unavailableEatingWindows', newWin);
        }}>+ إضافة وقت منع</button>
      </div>
    </div>
  );
}
