import { Config } from "@remotion/cli/config";

// Master image & audio episode disajikan langsung dari folder episode,
// jadi `staticFile("images/scene-01.png")` menunjuk ke aset episode tersebut.
Config.setPublicDir("../../projects/episodes/LS-0001");

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setChromiumOpenGlRenderer("swangle");
Config.setOverwriteOutput(true);
