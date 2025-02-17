{pkgs}: {
  deps = [
    pkgs.nodejs-20
    pkgs.postgresql
    pkgs.nginx # Optional: For web hosting
    pkgs.git   # Ensures Git is available in deployments
  ];
}