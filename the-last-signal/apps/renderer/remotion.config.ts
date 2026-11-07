import { Config } from "@remotion/cli/config";

// Master image & audio episode disajikan langsung dari folder episode,
// jadi `staticFile("images/scene-01.png")` menunjuk ke aset episode tersebut.
// Dulu menunjuk projects/episodes/LS-0001 (sudah diarsipkan) sehingga studio
// dan bundling gagal. Bundle render selalu mengirim publicDir episode yang
// sedang dirender dari scripts/render.ts.
Config.setPublicDir("../../apps/renderer/public");

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setChromiumOpenGlRenderer("swangle");
Config.setOverwriteOutput(true);
