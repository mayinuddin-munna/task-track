import { NextResponse } from "next/server";
import { getTaskTrackState, saveTaskTrackState } from "../../../lib/task-track/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await getTaskTrackState();

    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to load TaskTrack data",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const state = await saveTaskTrackState(body);

    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to save TaskTrack data",
      },
      { status: 500 },
    );
  }
}
