{
  pkgs,
  lib,
  config,
  inputs,
  ...
}:

{
  packages = [
    pkgs.just
    pkgs.chromium
  ];

  languages.javascript.enable = true;
  languages.typescript.enable = true;

  claude.code.enable = true;
  claude.code.mcpServers = {
    playwright = {
      type = "stdio";
      command = "npx";
      args = [
        "@playwright/mcp@latest"
        "--headless"
        "--executable-path"
        "${pkgs.chromium}/bin/chromium"
      ];
    };
    storybook = {
      type = "http";
      url = "http://localhost:6006/mcp";
    };
  };
}
