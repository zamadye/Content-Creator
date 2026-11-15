import { z } from "zod";

export const MAX_TIME_US = Number.MAX_SAFE_INTEGER;
const US_PER_SECOND = 1_000_000n;

export const TimeUsSchema = z.number().int().min(0).max(MAX_TIME_US);
export type TimeUs = z.infer<typeof TimeUsSchema>;

export const FpsSchema = z
  .strictObject({
    numerator: z.number().int().min(1).max(120_000),
    denominator: z.number().int().min(1).max(120_000),
  })
  .refine(({ numerator, denominator }) => numerator <= 120 * denominator, {
    message: "FPS must not exceed 120",
  });
export type Fps = z.infer<typeof FpsSchema>;

export const TimeRangeSchema = z
  .strictObject({ startUs: TimeUsSchema, endUs: TimeUsSchema })
  .refine(({ startUs, endUs }) => endUs > startUs, {
    message: "Time ranges are non-empty half-open intervals [startUs, endUs)",
    path: ["endUs"],
  });
export type TimeRange = z.infer<typeof TimeRangeSchema>;

function asBigInt(value: number, name: string): bigint {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer`);
  }
  return BigInt(value);
}

function parseFps(fps: Fps): [bigint, bigint] {
  const parsed = FpsSchema.parse(fps);
  return [BigInt(parsed.numerator), BigInt(parsed.denominator)];
}

/** Number of output frames required to cover durationUs (ceil, exact rational math). */
export function frameCountForDuration(durationUs: TimeUs, fps: Fps): number {
  const duration = BigInt(TimeUsSchema.parse(durationUs));
  const [num, den] = parseFps(fps);
  const dividend = duration * num;
  const divisor = US_PER_SECOND * den;
  const count = (dividend + divisor - 1n) / divisor;
  if (count > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError("Frame count exceeds safe integer range");
  return Number(count);
}

/** Frame whose half-open interval contains timeUs; exact boundaries map to the next frame. */
export function frameIndexAt(timeUs: TimeUs, fps: Fps): number {
  const time = BigInt(TimeUsSchema.parse(timeUs));
  const [num, den] = parseFps(fps);
  const index = (time * num) / (US_PER_SECOND * den);
  if (index > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError("Frame index exceeds safe integer range");
  return Number(index);
}

/** Start time of frameIndex, rounded down to the nearest microsecond exactly once. */
export function frameStartUs(frameIndex: number, fps: Fps): TimeUs {
  const frame = asBigInt(frameIndex, "frameIndex");
  const [num, den] = parseFps(fps);
  const timeUs = (frame * US_PER_SECOND * den) / num;
  if (timeUs > BigInt(MAX_TIME_US)) throw new RangeError("Frame time exceeds safe integer range");
  return Number(timeUs);
}

const TIMECODE = /^(\d{2,}):(\d{2}):(\d{2})\.(\d{3})$/;

/** Parse strict UI timecode HH:MM:SS.mmm to integer microseconds. */
export function parseTimecode(value: string): TimeUs {
  const match = TIMECODE.exec(value);
  if (!match) throw new TypeError("Timecode must use HH:MM:SS.mmm");
  const [, hoursText, minutesText, secondsText, millisText] = match;
  const hours = BigInt(hoursText!);
  const minutes = BigInt(minutesText!);
  const seconds = BigInt(secondsText!);
  const millis = BigInt(millisText!);
  if (minutes >= 60n || seconds >= 60n) throw new RangeError("Minutes and seconds must be below 60");
  const totalUs = (((hours * 60n + minutes) * 60n + seconds) * 1_000n + millis) * 1_000n;
  if (totalUs > BigInt(MAX_TIME_US)) throw new RangeError("Timecode exceeds safe integer range");
  return Number(totalUs);
}

/** Format integer microseconds as HH:MM:SS.mmm; hours may exceed two digits. */
export function formatTimecode(timeUs: TimeUs): string {
  const remainder = BigInt(TimeUsSchema.parse(timeUs));
  const millis = remainder / 1_000n % 1_000n;
  const totalSeconds = remainder / US_PER_SECOND;
  const seconds = totalSeconds % 60n;
  const totalMinutes = totalSeconds / 60n;
  const minutes = totalMinutes % 60n;
  const hours = totalMinutes / 60n;
  const pad = (n: bigint, width: number) => n.toString().padStart(width, "0");
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(millis, 3)}`;
}
