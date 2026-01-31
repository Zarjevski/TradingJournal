import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const dataToUpdate: Record<string, unknown> = {};

    if (body.firstName) {
      if (typeof body.firstName !== "string" || body.firstName.trim().length === 0) {
        return NextResponse.json(
          { error: "First name must be a non-empty string" },
          { status: 400 }
        );
      }
      dataToUpdate.firstName = body.firstName.trim();
    }

    if (body.lastName) {
      if (typeof body.lastName !== "string" || body.lastName.trim().length === 0) {
        return NextResponse.json(
          { error: "Last name must be a non-empty string" },
          { status: 400 }
        );
      }
      dataToUpdate.lastName = body.lastName.trim();
    }

    if (body.email) {
      if (typeof body.email !== "string" || !body.email.includes("@")) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }

      // Check if email is already taken by another user
      const existingUser = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (existingUser && existingUser.id !== currentUser.id) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 }
        );
      }

      dataToUpdate.email = body.email.trim();
    }

    if (body.password) {
      if (typeof body.password !== "string" || body.password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }
      dataToUpdate.password = await bcrypt.hash(body.password, 12);
    }

    if (body.photoURL !== undefined) {
      dataToUpdate.photoURL = body.photoURL ? String(body.photoURL).trim() : null;
    }

    if (body.status !== undefined) {
      const validStatuses = ["NEUTRAL", "BEARISH", "BULLISH"];
      if (typeof body.status !== "string" || !validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "Status must be one of: NEUTRAL, BEARISH, BULLISH" },
          { status: 400 }
        );
      }
      dataToUpdate.status = body.status;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        photoURL: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
