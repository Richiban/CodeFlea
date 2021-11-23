import * as vscode from "vscode";

export type JumpConfig = {
  characters: string;
  timeout: number;
};

export type DecorationConfig = {
  backgroundColor: string;
  secondaryBackgroundColor: string;
  backgroundOpacity: string;
  color: string;
  borderColor: string;

  width: number;
  height: number;

  x: number;
  y: number;

  fontSize: number;
  fontWeight: string;
  fontFamily: string;
};

export type Config = {
  decoration: DecorationConfig;
  jump: JumpConfig;
  scrollStep: number;
};

export function loadConfig(): Config {
  const config = vscode.workspace.getConfiguration("codeFlea");

  return {
    decoration: config.get<DecorationConfig>("decoration")!,
    jump: config.get<JumpConfig>("jump")!,
    scrollStep: config.get<number>("scrollStep") || 10,
  };
}
