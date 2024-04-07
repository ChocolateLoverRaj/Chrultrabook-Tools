{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };
  outputs = { self, nixpkgs, flake-utils, rust-overlay }:
    flake-utils.lib.eachDefaultSystem
      (system:
        let
          overlays = [ (import rust-overlay) ];
          pkgs = import nixpkgs {
            inherit system overlays;
          };
          libraries = with pkgs;[
            webkitgtk
            gtk3
            cairo
            gdk-pixbuf
            glib
            dbus
            openssl_3
            librsvg
            libappindicator
          ];

          packages = with pkgs; [
            curl
            wget
            pkg-config
            dbus
            openssl_3
            glib
            gtk3
            libsoup
            webkitgtk
            librsvg
            libappindicator
            rust-bin.stable.latest.default
            nodejs
            (pkgs.stdenv.mkDerivation rec {
              name = "cros-ectool";
              nativeBuildInputs = with pkgs; [ cmake ninja pkg-config libusb libftdi1 ];
              src = pkgs.fetchFromGitLab {
                domain = "gitlab.howett.net";
                owner = "DHowett";
                repo = "ectool";
                rev = "3ebe7b8b713b2ebfe2ce92d48fd8d044276b2879";
                hash = "sha256-s6PrFPAL+XJAENqLw5oJqFmAf11tHOJ8h3F5l3pOlZ4=";
              };
              installPhase = ''
                mkdir -p $out/bin
                cp src/ectool $out/bin/ectool
              '';
            })
            libudev-zero
            libusb1
            hidapi
          ];
        in
        with pkgs;
        {
          devShell = pkgs.mkShell {
            buildInputs = packages;

            shellHook =
              ''
                export LD_LIBRARY_PATH=${pkgs.lib.makeLibraryPath libraries}:$LD_LIBRARY_PATH
                export XDG_DATA_DIRS=${pkgs.gsettings-desktop-schemas}/share/gsettings-schemas/${pkgs.gsettings-desktop-schemas.name}:${pkgs.gtk3}/share/gsettings-schemas/${pkgs.gtk3.name}:$XDG_DATA_DIRS
              '';
          };
        }
      );
}
