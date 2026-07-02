import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { RateLimiter, RATE_LIMITS, MemoryStore } from "../../../lib/security/rateLimit";
import { logAuditEvent } from "../../../lib/security/auditLogger";
import { AuditAction } from "../../../lib/security/auditActions";

const uploadStore = new MemoryStore();
const uploadLimiter = new RateLimiter(uploadStore, RATE_LIMITS.UPLOAD, "upload");

// Konfigurasi otomatis mengambil dari process.env (jika format penamaannya standar Cloudinary: CLOUDINARY_URL atau CLOUDINARY_CLOUD_NAME dll)
// Namun kita pastikan konfigurasinya dengan env yang sudah diatur
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await uploadLimiter.consume(session.user.id);
    if (!rateLimitResult.success) {
      try {
        await logAuditEvent({
          action: AuditAction.UPLOAD_RATE_LIMIT,
          actorId: session.user.id,
          resource: "upload",
          metadata: {
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime,
          },
        });
      } catch {
        // fail-open: ignore logging error and proceed to block
      }
      return NextResponse.json({ success: false, error: "Too many upload requests" }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileBase64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fileBase64, {
      folder: "apsasrama/santri", // Akan membuat folder ini otomatis di Cloudinary
    });

    return NextResponse.json({ success: true, url: result.secure_url });
  } catch (error: unknown) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 });
  }
}
