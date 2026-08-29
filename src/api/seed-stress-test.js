import sequelize from "./config/database.js";
import { User, Program, IntakeSubmission, CheckinSubmission } from "./models/index.js";

const STRESS_TEST_CLIENTS = [
  { client_code: '1', full_name: 'أحمد محمود العوضي', phone_number: '01011111101', role: 'CLIENT', subscription_package: 'MAX_3_PLUS_1', subscription_price: 3500, subscription_status: 'ACTIVE', payment_status: 'PAID', payment_method: 'INSTAPAY' },
  { client_code: '2', full_name: 'منى عبد الرحمن السعيد', phone_number: '01022222202', role: 'CLIENT', subscription_package: 'ELITE_3_PLUS_1', subscription_price: 2500, subscription_status: 'ACTIVE', payment_status: 'PAID', payment_method: 'VODAFONE_CASH' },
  { client_code: '3', full_name: 'هدى إبراهيم الشناوي', phone_number: '01033333303', role: 'CLIENT', subscription_package: 'MAX_3_PLUS_1', subscription_price: 3500, subscription_status: 'ACTIVE', payment_status: 'PAID', payment_method: 'INSTAPAY' },
  { client_code: '4', full_name: 'عمر طارق الشريف', phone_number: '01044444404', role: 'CLIENT', subscription_package: 'MAX_3_PLUS_1', subscription_price: 3500, subscription_status: 'ACTIVE', payment_status: 'PAID', payment_method: 'INSTAPAY' },
  { client_code: '5', full_name: 'خالد مصطفى النجار', phone_number: '01055555505', role: 'CLIENT', subscription_package: 'ELITE_3_PLUS_1', subscription_price: 2500, subscription_status: 'ACTIVE', payment_status: 'PAID', payment_method: 'VODAFONE_CASH' },
  { client_code: '6', full_name: 'سارة كمال المهدي', phone_number: '01066666606', role: 'CLIENT', subscription_package: 'ELITE_3_PLUS_1', subscription_price: 2500, subscription_status: 'ACTIVE', payment_status: 'PAID', payment_method: 'INSTAPAY' },
  { client_code: '7', full_name: 'محمود عبد العظيم حسان', phone_number: '01077777707', role: 'CLIENT', subscription_package: 'MAX_3_PLUS_1', subscription_price: 3500, subscription_status: 'ACTIVE', payment_status: 'PAID', payment_method: 'INSTAPAY' },
  { client_code: '8', full_name: 'نادية حسن الدسوقي', phone_number: '01088888808', role: 'CLIENT', subscription_package: 'ELITE_3_PLUS_1', subscription_price: 2500, subscription_status: 'ACTIVE', payment_status: 'PAID', payment_method: 'VODAFONE_CASH' },
  { client_code: '9', full_name: 'ياسر سامي القاضي', phone_number: '01099999909', role: 'CLIENT', subscription_package: 'MAX_3_PLUS_1', subscription_price: 3500, subscription_status: 'ACTIVE', payment_status: 'PAID', payment_method: 'INSTAPAY' },
  { client_code: '10', full_name: 'ريم حازم التلمساني', phone_number: '01010101010', role: 'CLIENT', subscription_package: 'MAX_3_PLUS_1', subscription_price: 3500, subscription_status: 'ACTIVE', payment_status: 'PAID', payment_method: 'INSTAPAY' },
  { client_code: '11', full_name: 'حسام الدين البغدادي', phone_number: '01011122211', role: 'CLIENT', subscription_package: 'MAX_3_PLUS_1', subscription_price: 3500, subscription_status: 'ACTIVE', payment_status: 'PAID', payment_method: 'INSTAPAY' },
  { client_code: '12', full_name: 'دينا شريف خورشيد', phone_number: '01012121212', role: 'CLIENT', subscription_package: 'ELITE_3_PLUS_1', subscription_price: 2500, subscription_status: 'ACTIVE', payment_status: 'PAID', payment_method: 'VODAFONE_CASH' },
  { client_code: '13', full_name: 'يوسف أيمن رضوان', phone_number: '01013131313', role: 'CLIENT', subscription_package: 'MAX_3_PLUS_1', subscription_price: 3500, subscription_status: 'ACTIVE', payment_status: 'PAID', payment_method: 'INSTAPAY' },
  { client_code: '14', full_name: 'زينب فؤاد الغمري', phone_number: '01014141414', role: 'CLIENT', subscription_package: 'ELITE_3_PLUS_1', subscription_price: 2500, subscription_status: 'ACTIVE', payment_status: 'PAID', payment_method: 'VODAFONE_CASH' },
  { client_code: '15', full_name: 'عبد الله توفيق الصياد', phone_number: '01015151515', role: 'CLIENT', subscription_package: 'MAX_3_PLUS_1', subscription_price: 3500, subscription_status: 'ACTIVE', payment_status: 'PAID', payment_method: 'INSTAPAY' }
];

async function seedDatabase() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // 1. Clear old records
    console.log('Purging old test data...');
    try {
      await Program.destroy({ where: {}, truncate: false });
      await IntakeSubmission.destroy({ where: {}, truncate: false });
      await CheckinSubmission.destroy({ where: {}, truncate: false });
      await User.destroy({ where: { role: 'CLIENT' } });
      console.log('Old records purged.');
    } catch (e) {
      console.warn('Purge notice:', e.message);
    }

    // 2. Insert the 15 Stress Test Clients
    console.log('Inserting 15 Clinical Stress Test Clients...');
    for (const c of STRESS_TEST_CLIENTS) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 120);

      const createdUser = await User.create({
        ...c,
        subscription_start_date: startDate,
        subscription_end_date: endDate
      });

      // Create initial intake submission record
      await IntakeSubmission.create({
        user_id: createdUser.id,
        status: parseInt(c.client_code, 10) % 2 === 0 ? 'REVIEWED' : 'PENDING',
        answers: {
          client_code: c.client_code,
          full_name: c.full_name,
          phone: c.phone_number,
          personal: {
            fullName: c.full_name,
            phone: c.phone_number
          }
        }
      });

      console.log('Created Client #' + c.client_code + ': ' + c.full_name);
    }

    console.log('\n--- ALL 15 CLIENTS SEEDED IN DB SUCCESSFULLY ---');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedDatabase();
