import { useState } from "react";
import "./App.css"; // ใช้ CSS default ของ Vite หรือลบออกก็ได้ครับ

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [error, setError] = useState("");

  // 1. ฟังก์ชันจัดการเมื่อผู้ใช้เลือกไฟล์
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadedUrl(null); // เคลียร์รูปเก่า (ถ้ามี)
      setError("");
    }
  };

  // 2. ฟังก์ชันอัพโหลด
  const handleUpload = async () => {
    if (!selectedFile) {
      setError("กรุณาเลือกไฟล์ก่อนครับ");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // Step A: ขอ Signed URL จาก Backend (Vercel API Route)
      // เราส่งชื่อไฟล์และประเภทไฟล์ไปเพื่อให้ Backend สร้าง Key ที่ถูกต้อง
      const response = await fetch(
        `/api/upload-url?filename=${encodeURIComponent(
          selectedFile.name
        )}&contentType=${encodeURIComponent(selectedFile.type)}`
      );

      if (!response.ok) {
        throw new Error("ไม่สามารถขอ Upload URL ได้");
      }

      const { url, publicUrl } = await response.json();
      // หมายเหตุ: Backend ควรส่ง publicUrl กลับมาด้วย หรือเราจะ Hardcode path เองก็ได้

      // Step B: อัพโหลดไฟล์ไป GCS โดยตรงด้วย Signed URL (PUT Method)
      const uploadResponse = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type, // *สำคัญมาก* ต้องตรงกับที่แจ้งตอนขอ Signed URL
        },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("อัพโหลดไป Google Cloud ไม่สำเร็จ");
      }

      // Step C: สำเร็จ! แสดงรูป
      setUploadedUrl(publicUrl);
      // หรือถ้า Backend ไม่ส่ง publicUrl มา ให้ใช้ format:
      // https://storage.googleapis.com/[ชื่อ-BUCKET-ของคุณ]/[ชื่อไฟล์]
    } catch (err) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการอัพโหลด");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "sans-serif",
        maxWidth: "500px",
        margin: "0 auto",
      }}
    >
      <h2>อัพโหลดรูปภาพ (GCS + Vercel)</h2>

      {/* ส่วนเลือกไฟล์ */}
      <div style={{ marginBottom: "20px" }}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      {/* ปุ่มอัพโหลด */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        style={{ padding: "10px 20px", cursor: "pointer" }}
      >
        {uploading ? "กำลังอัพโหลด..." : "อัพโหลดรูปภาพ"}
      </button>

      {/* แสดง Error */}
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      {/* แสดงรูปตัวอย่างเมื่ออัพโหลดเสร็จ */}
      {uploadedUrl && (
        <div style={{ marginTop: "20px" }}>
          <h3>อัพโหลดสำเร็จ!</h3>
          <p>
            URL:{" "}
            <a href={uploadedUrl} target="_blank" rel="noreferrer">
              เปิดดูรูปภาพ
            </a>
          </p>
          <img
            src={uploadedUrl}
            alt="Uploaded"
            style={{
              maxWidth: "100%",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
