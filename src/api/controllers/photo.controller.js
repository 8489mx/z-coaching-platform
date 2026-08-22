import { User, ProgressPhoto } from "../models/index.js";

export const getUserPhotos = async (req, res) => {
  try {
    const { user_id } = req.params;

    let user = await User.findOne({ where: { client_code: user_id } });
    if (!user && !isNaN(user_id)) {
      user = await User.findByPk(parseInt(user_id, 10));
    }
    if (!user) {
      user = await User.findOne({ where: { phone_number: user_id } });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const photos = await ProgressPhoto.findAll({
      where: { user_id: user.id },
      order: [["week_number", "ASC"], ["createdAt", "ASC"]],
    });

    return res.status(200).json({ user, photos });
  } catch (err) {
    console.error("getUserPhotos error:", err);
    return res.status(500).json({ error: "فشل استرجاع صور التطور", details: err.message });
  }
};

export const uploadUserPhoto = async (req, res) => {
  try {
    const { user_id, week_number, pose, photo_url, notes } = req.body;

    let user = await User.findOne({ where: { client_code: user_id } });
    if (!user && !isNaN(user_id)) {
      user = await User.findByPk(parseInt(user_id, 10));
    }
    if (!user) {
      user = await User.findOne({ where: { phone_number: user_id } });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!photo_url) {
      return res.status(400).json({ error: "photo_url is required" });
    }

    const photo = await ProgressPhoto.create({
      user_id: user.id,
      week_number: Number(week_number) || 1,
      pose: pose || "FRONT",
      photo_url,
      notes: notes || null,
    });

    return res.status(201).json({
      message: "تم رفع وحفظ صورة التطور بنجاح!",
      photo,
    });
  } catch (err) {
    console.error("uploadUserPhoto error:", err);
    return res.status(500).json({ error: "فشل رفع الصورة", details: err.message });
  }
};

export const deleteUserPhoto = async (req, res) => {
  try {
    const { photo_id } = req.params;
    const deleted = await ProgressPhoto.destroy({ where: { id: photo_id } });

    if (!deleted) {
      return res.status(404).json({ error: "الصورة غير موجودة" });
    }

    return res.status(200).json({ message: "تم حذف الصورة بنجاح" });
  } catch (err) {
    console.error("deleteUserPhoto error:", err);
    return res.status(500).json({ error: "فشل حذف الصورة", details: err.message });
  }
};
