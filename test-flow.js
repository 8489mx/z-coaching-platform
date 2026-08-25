async function runE2ETest() {
  const API_URL = 'http://localhost:3000/api/v1';
  const testPhone = '01099988877';
  const testCode = 'TEST99';
  
  console.log("=========================================");
  console.log("🚀 STARTING E2E TEST SCENARIO...");
  console.log("=========================================");

  try {
    // Check if server is reachable
    try {
      await fetch(`http://localhost:3000/`);
    } catch (e) {
      console.error("❌ ERROR: Server is not running on http://localhost:3000");
      console.error("Please run the server first: npm run dev or node src/api/server.js");
      return;
    }

    // 1. REGISTER CLIENT (Simulating Coach creating a new client)
    console.log(`\n[1] Registering new client: Code=${testCode}, Phone=${testPhone}...`);
    const registerRes = await fetch(`${API_URL}/auth/register-fast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_code: testCode,
        phone_number: testPhone,
        full_name: 'Test Client VIP'
      })
    });
    
    // Ignore 400 if already exists, just continue
    if (registerRes.ok) {
      console.log("✅ Client registered successfully.");
    } else {
      console.log("⚠️ Client might already exist. Proceeding to login...");
    }

    // 2. CLIENT LOGIN
    console.log(`\n[2] Client Login: Attempting to log in...`);
    const loginRes = await fetch(`${API_URL}/auth/login-fast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_code: testCode,
        phone_number: testPhone
      })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(loginData.error || 'Login failed');
    console.log("✅ Login successful. Received token.");

    // 3. SUBMIT INTAKE (Client Onboarding)
    console.log(`\n[3] Submitting Intake Data (Medical & Physical)...`);
    const intakeRes = await fetch(`${API_URL}/intake/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_code: testCode,
        phone_number: testPhone,
        age: 28,
        weightKg: 85,
        heightCm: 180,
        gender: 'MALE',
        experienceLevel: 'INTERMEDIATE',
        trainingEnvironment: 'GYM',
        selectedConditions: ['NONE_HEALTHY']
      })
    });
    const intakeData = await intakeRes.json();
    if (!intakeRes.ok) throw new Error(intakeData.error || 'Intake submission failed');
    const submissionId = intakeData.submission_id;
    console.log(`✅ Intake submitted successfully. Submission ID: ${submissionId}`);

    // 4. GENERATE DRAFT (Coach Action)
    console.log(`\n[4] Generating Draft (Master Engine AI)...`);
    const draftRes = await fetch(`${API_URL}/intake/${submissionId}/generate-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const draftData = await draftRes.json();
    if (!draftRes.ok) throw new Error(draftData.error || 'Draft generation failed');
    console.log(`✅ Draft generated successfully. Macros: Calories ${draftData.master_program?.nutrition?.targets?.calories || 'N/A'}`);

    // 5. APPROVE & PUBLISH (Coach Action)
    console.log(`\n[5] Approving and Publishing Plan...`);
    const publishRes = await fetch(`${API_URL}/intake/${submissionId}/approve-and-publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coach_notes: 'Welcome! This is an automated test note.'
      })
    });
    const publishData = await publishRes.json();
    if (!publishRes.ok) throw new Error(publishData.error || 'Publishing failed');
    console.log("✅ Plan published successfully to client app!");

    console.log("\n🎉 E2E TEST COMPLETED SUCCESSFULLY! ZERO ERRORS.");

  } catch (err) {
    console.error("\n❌ TEST FAILED:", err.message);
  }
}

runE2ETest();
