import { redirect } from "next/navigation";
import { buildTaskTrackPath, DEFAULT_PAGE, DEFAULT_ROLE } from "../lib/task-track/routes";

export default function HomePage() {
  redirect(buildTaskTrackPath(DEFAULT_ROLE, DEFAULT_PAGE, "role-first"));
}
