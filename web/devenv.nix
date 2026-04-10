{
  pkgs,
  lib,
  config,
  inputs,
  ...
}:

{
  packages = [
    inputs.quizlang.packages.${pkgs.system}.default
    pkgs.just
  ];

  languages.javascript.enable = true;
  languages.typescript.enable = true;
}
