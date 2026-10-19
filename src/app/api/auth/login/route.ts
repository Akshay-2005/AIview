import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";

declare global {
  // eslint-disable-next-line no-var
  var __aiview_users: Map<string, { id: string; name: string; email: string; passwordHash: string; profileComplete: boolean }>;
}

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 400 });
    }

    const { email, password } = parsed.data;

    // Find user
    let foundUser = null;
    for (const user of (global.__aiview_users || new Map()).values()) {
      if (user.email === email) {
        foundUser = user;
        break;
      }
    }

    if (!foundUser) {
      return NextResponse.json({ message: "No account found with this email" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, foundUser.passwordHash);
    if (!valid) {
      return NextResponse.json({ message: "Incorrect password" }, { status: 401 });
    }

    // Sign a simple JWT (use proper secret in production via env var)
    const secret = process.env.JWT_SECRET || "aiview-dev-secret-change-in-production";
    const token = sign(
      { sub: foundUser.id, email: foundUser.email },
      secret,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        profileComplete: foundUser.profileComplete,
      },
    });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
