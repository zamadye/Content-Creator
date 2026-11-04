import { probeFfmpeg } from "./lib/ffmpeg";
import { readdirSync } from "node:fs";
const dir = process.cwd() + "/projects/episodes/LS-0002/audio/narration";
let total = 0;
for (const f of readdirSync(dir).sort()) {
  const out = probeFfmpeg(["-hide_banner", "-i", `${dir}/${f}`]);
  const m = out.match(/Duration:\s(\d+):(\d+):(\d+\.\d+)/);
  const s = m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
  total += s;
  console.log(f, s.toFixed(2));
}
console.log("TOTAL", total.toFixed(2), "→ dengan padding 4+8 frame:", (total + 6 * 12 / 30).toFixed(2));
