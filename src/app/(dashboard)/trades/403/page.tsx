import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ForbiddenPage() {
  // Simple redirect to trades page with a message
  // The actual 403 handling is done in the trade details page
  redirect("/trades");
}
