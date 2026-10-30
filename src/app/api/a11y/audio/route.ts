import { createAudioHandler } from "accessibility-toolbar/server";
import { generateAudio } from "@/lib/a11y/audio-server";

export const runtime = "nodejs";
export const POST = createAudioHandler({ generateAudio, filename: "RCET-Audio.mp3" });
