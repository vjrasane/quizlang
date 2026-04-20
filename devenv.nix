{
  pkgs,
  lib,
  config,
  inputs,
  ...
}:

{
  packages = [ pkgs.git ];

  languages.rust.enable = true;

  scripts.quiz.exec = ''cargo run --quiet -- "$@"'';
}
