const {Config} = require('@remotion/cli/config');

module.exports = {
  config: Config,
};

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(90);
Config.setOverwriteOutput(true);
Config.setConcurrency(2);
// Use the @sparticuz/chromium binary (extracted by test-chromium / executablePath)
Config.setBrowserExecutable('/tmp/chromium');
Config.setChromiumOpenGlRenderer('swangle');
Config.setChromiumDisableWebSecurity(true);
