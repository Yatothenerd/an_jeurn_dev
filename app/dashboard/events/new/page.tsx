import { redirect } from "next/navigation";

// Clients can no longer create their own events — events are created and
// assigned by an administrator. Any direct navigation here returns to the list.
export default function NewEventPage() {
  redirect("/dashboard");
}
