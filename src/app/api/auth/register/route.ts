import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

// Simple in-memory store (replace with Prisma/DB in production)
// For now this persists while the server is running
declare global {
  // eslint-disable-next-line no-var
  var __aiview_users: Map<string, { id: string; name: string; email: string; passwordHash: string; profileComplete: boolean }>;
}
if (!global.__aiview_users) {
  global.__aiview_users = new Map();
}

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Check if email already exists
    for (const user of global.__aiview_users.values()) {
      if (user.email === email) {
        return NextResponse.json(
          { message: "An account with this email already exists" },
          { status: 409 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const id = uuidv4();

    global.__aiview_users.set(id, {
      id,
      name,
      email,
      passwordHash,
      profileComplete: false,
    });

    return NextResponse.json({
      success: true,
      user: { id, name, email, profileComplete: false },
    });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
