import { NextRequest, NextResponse } from "next/server";

declare global {
  // eslint-disable-next-line no-var
  var __aiview_profiles: Map<string, Record<string, unknown>>;
}
if (!global.__aiview_profiles) {
  global.__aiview_profiles = new Map();
}

declare global {
  // eslint-disable-next-line no-var
  var __aiview_users: Map<string, { id: string; name: string; email: string; passwordHash: string; profileComplete: boolean }>;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, ...profileData } = body;

    if (!userId) {
      return NextResponse.json({ message: "userId required" }, { status: 400 });
    }

    global.__aiview_profiles.set(userId, { userId, ...profileData, createdAt: new Date().toISOString() });

    // Mark user as profileComplete
    const user = global.__aiview_users?.get(userId);
    if (user) {
      global.__aiview_users.set(userId, { ...user, profileComplete: true });
    }

    return NextResponse.json({ success: true, profile: { userId, ...profileData } });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ message: "userId required" }, { status: 400 });
  const profile = global.__aiview_profiles?.get(userId);
  if (!profile) return NextResponse.json({ message: "Profile not found" }, { status: 404 });
  return NextResponse.json({ success: true, profile });
}
