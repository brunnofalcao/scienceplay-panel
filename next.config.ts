import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fixa a raiz do workspace neste projeto — evita que um package-lock.json
  // perdido em diretórios acima faça o Next inferir a raiz errada.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
