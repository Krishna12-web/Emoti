{ pkgs }: {
  # Specify the Nixpkgs channel
  channel = "stable-24.11"; # or "unstable"

  # Packages to install in the dev environment
  packages = [
    pkgs.nodejs_20
    pkgs.zulu
  ];

  # Optional environment variables
  env = {};

  # Firebase emulator configuration
  services = {
    firebase = {
      emulators = {
        detect = true;
        projectId = "demo-app";
        services = [ "auth" "firestore" ];
      };
    };
  };

  # IDX (Firebase Studio) configuration
  idx = {
    # Optional: add VS Code extensions (publisher.extensionId from https://open-vsx.org/)
    extensions = [
      # "vscodevim.vim"
    ];

    workspace = {
      onCreate = {
        default = {
          openFiles = [ "src/app/page.tsx" ];
        };
      };
    };

    previews = {
      enable = true;
      previews = {
        web = {
          command = [ "npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0" ];
          manager = "web";
        };
      };
    };
  };
}

