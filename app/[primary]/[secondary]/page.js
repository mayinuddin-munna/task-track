import { notFound, redirect } from "next/navigation";
import TaskTrackApp from "../../../features/task-track";
import { buildTaskTrackPath, resolveTaskTrackRoute } from "../../../lib/task-track/routes";
import { getTaskTrackState } from "../../../lib/task-track/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TaskTrackRoutePage({ params }) {
  const resolvedParams = await params;
  const route = resolveTaskTrackRoute(resolvedParams.primary, resolvedParams.secondary);

  if (!route) {
    notFound();
  }

  if (route.needsRedirect) {
    redirect(buildTaskTrackPath(route.role, route.page, route.order));
  }

  const initialData = await getTaskTrackState();

  return <TaskTrackApp initialData={initialData} initialRoute={route} />;
}
