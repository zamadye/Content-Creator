/** Timeline data contract shared by the authoring layer and the render pipeline. */
export type SceneTiming = {
  id: string;
  startFrame: number;
  durationInFrames: number;
  vo?: string | null;
  purpose?: string;
};

export type CaptionCue = {
  text: string[];
  startFrame: number;
  durationInFrames: number;
  /** source segment id, for traceability back to the script */
  segment?: string;
};

export type VOTrack = {
  id: string;
  file: string;
  startFrame: number;
  durationInFrames: number;
};

export type Timeline = {
  topic: string;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  generatedAt: string;
  scenes: SceneTiming[];
  captions: CaptionCue[];
  vo: VOTrack[];
};
