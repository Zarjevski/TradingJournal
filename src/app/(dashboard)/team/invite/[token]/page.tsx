import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/teamAuth";
import AcceptInviteClient from "./AcceptInviteClient";

export const dynamic = "force-dynamic";

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  await requireAuth();
  return <AcceptInviteClient token={token} />;
}
