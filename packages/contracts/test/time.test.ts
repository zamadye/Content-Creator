import assert from "node:assert/strict";
import test from "node:test";
import {
  FpsSchema,
  TimeRangeSchema,
  formatTimecode,
  frameCountForDuration,
  frameIndexAt,
  frameStartUs,
  parseTimecode,
} from "../src/index.js";

test("timecode round-trips with integer microseconds and hours beyond 99", () => {
  const value = parseTimecode("123:59:58.007");
  assert.equal(formatTimecode(value), "123:59:58.007");
});

test("strict timecode rejects overflow and ambiguous formatting", () => {
  assert.throws(() => parseTimecode("00:60:00.000"), RangeError);
  assert.throws(() => parseTimecode("0:00:00.000"), TypeError);
  assert.throws(() => parseTimecode("00:00:00,500"), TypeError);
  assert.throws(() => parseTimecode("999999999999999999:00:00.000"), RangeError);
});

test("frame count uses ceiling on exact rational FPS", () => {
  const fps = { numerator: 30_000, denominator: 1_001 };
  assert.equal(frameCountForDuration(1_000_000, fps), 30);
  assert.equal(frameCountForDuration(1, { numerator: 30, denominator: 1 }), 1);
  assert.equal(frameCountForDuration(0, { numerator: 30, denominator: 1 }), 0);
});

test("frame index is half-open and frame boundaries do not accumulate float drift", () => {
  const fps = { numerator: 30_000, denominator: 1_001 };
  const boundary = frameStartUs(30, fps);
  assert.equal(frameIndexAt(boundary, fps), 30);
  assert.equal(frameIndexAt(boundary - 1, fps), 29);
  assert.equal(frameStartUs(60, fps), 2_002_000);
});

test("schemas reject unsafe times, malformed FPS, and empty ranges", () => {
  assert.equal(TimeRangeSchema.safeParse({ startUs: 10, endUs: 11 }).success, true);
  assert.equal(TimeRangeSchema.safeParse({ startUs: 11, endUs: 11 }).success, false);
  assert.equal(TimeRangeSchema.safeParse({ startUs: -1, endUs: 11 }).success, false);
  assert.equal(FpsSchema.safeParse({ numerator: 30, denominator: 1 }).success, true);
  assert.equal(FpsSchema.safeParse({ numerator: 240, denominator: 1 }).success, false);
  assert.equal(FpsSchema.safeParse({ numerator: 30, denominator: 1, mode: "float" }).success, false);
});

test("frame conversions reject negative and unsafe integer inputs", () => {
  assert.throws(() => frameStartUs(-1, { numerator: 30, denominator: 1 }), RangeError);
  assert.throws(() => frameStartUs(Number.MAX_SAFE_INTEGER + 1, { numerator: 30, denominator: 1 }), RangeError);
});
