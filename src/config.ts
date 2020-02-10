import * as vscode from "vscode";

export type JumpConfig = {
  characters: string;
  wordSeparatorPattern: string;
  timeout: number;
  centerLineAfterJump: boolean;
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

  upperCase: boolean;
};

export type Config = {
  decoration: DecorationConfig;
  jump: JumpConfig;
};

export function loadConfig(): Config {
  const config = vscode.workspace.getConfiguration("codeFlea");

  // const newLocal = config.get<Config>("");

  // if (!newLocal) {
  //   vscode.window.showErrorMessage("Please check your codeFlea config");
  //   throw new Error("Invalid config");
  // }

  return {
    decoration: config.get<DecorationConfig>("decoration")!,
    jump: config.get<JumpConfig>("jump")!
  };
}
