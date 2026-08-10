import { IntakeSubmission } from "../models/index.js";

export const submitIntake = async (req, res) => {
  try {
    const intakePayload = req.body;
    
    if (!intakePayload) {
      return res.status(400).json({ error: "Invalid intake form data" });
    }

    const submission = await IntakeSubmission.create({
      user_id: req.user.id,
      answers: intakePayload,
      status: "PENDING"
    });

    return res.status(201).json({
      message: "Intake submitted successfully",
      submission_id: submission.id
    });
  } catch (err) {
    console.error("submitIntake error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getIntakeSubmission = async (req, res) => {
  try {
    const { id } = req.params; // submission id
    const submission = await IntakeSubmission.findByPk(id);
    
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    return res.status(200).json({ submission });
  } catch (err) {
    console.error("getIntakeSubmission error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
