import { Storage } from "@google-cloud/storage";

export default async function handler(req, res) {
  // 1. เชื่อมต่อ GCS ด้วย Credentials จาก Env
  const storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    credentials: {
      client_email: process.env.GCS_CLIENT_EMAIL,
      private_key: process.env.GCS_PRIVATE_KEY.replace(/\\n/g, "\n"), // แก้ปัญหาเรื่อง new line ใน env
    },
  });

  const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
  const file = bucket.file(req.query.filename); // ชื่อไฟล์ที่ส่งมาจาก Frontend

  // 2. สร้าง Signed URL สำหรับการ PUT (Upload)
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000, // หมดอายุใน 15 นาที
    contentType: req.query.contentType || "application/octet-stream", // ระบุประเภทไฟล์เพื่อความปลอดภัย
  });

  // 3. ส่ง URL กลับไปให้ Frontend
  res.status(200).json({ url });
}
