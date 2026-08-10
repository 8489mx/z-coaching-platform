import { User, IntakeSubmission } from "../models/index.js";

export const addClient = async (req, res) => {
  try {
    const { phone_number, full_name } = req.body;
    
    if (!phone_number) {
      return res.status(400).json({ error: "phone_number is required" });
    }

    const existingUser = await User.findOne({ where: { phone_number } });
    if (existingUser) {
      return res.status(400).json({ error: "Phone number already registered" });
    }

    // Generate client_code (sequential starting from 1)
    const lastUser = await User.findOne({
      where: { role: 'CLIENT' },
      order: [['id', 'DESC']]
    });

    let nextCode = 1;
    if (lastUser && lastUser.client_code) {
      const parsed = parseInt(lastUser.client_code, 10);
      if (!isNaN(parsed)) {
        nextCode = parsed + 1;
      }
    }

    const newUser = await User.create({ 
      client_code: nextCode.toString(), 
      phone_number, 
      full_name,
      role: 'CLIENT'
    });

    return res.status(201).json({ user: newUser });
  } catch (err) {
    console.error("addClient error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getClients = async (req, res) => {
  try {
    const clients = await User.findAll({
      where: { role: 'CLIENT' },
      include: [
        {
          model: IntakeSubmission,
          as: "intakeSubmissions",
          attributes: ['id', 'status', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json({ clients });
  } catch (err) {
    console.error("getClients error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
