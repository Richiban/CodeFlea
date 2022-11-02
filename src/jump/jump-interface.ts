import * as vscode from "vscode";
import { JumpLocations, JumpLocation, linqish, Cache } from "../common";
import { readKey } from "../inline-input";
import { Config } from "../config";

export type InterfaceType = "primary" | "secondary";

export type UserSelection =
  | { tag: "Ok"; userSelection: JumpLocation }
  | { tag: "None" }
  | { tag: "Cancelled" };

function generateJumpCodeImage(
  config: Config,
  code: string,
  interfaceType: InterfaceType
) {
  const cf = config.decoration;
  const width = code.length * cf.width;
  const bgColor =
    interfaceType === "primary"
      ? cf.backgroundColor
      : cf.secondaryBackgroundColor;

  const svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${cf.height}" height="${cf.height}" width="${width}"><rect width="${width}" height="${cf.height}" rx="4" ry="4" style="fill:${bgColor};fill-opacity:1;stroke:${cf.borderColor};stroke-opacity:${cf.backgroundOpacity};"/><text font-family="${cf.fontFamily}" font-weight="${cf.fontWeight}" font-size="${cf.fontSize}px" style="fill:${cf.color}" x="${cf.x}" y="${cf.y}">${code}</text></svg>`;

  return vscode.Uri.parse(svg);
}

export class JumpInterface {
  private jumpCodeImages: Cache<[string, InterfaceType], vscode.Uri>;
  private decorationTypes: Cache<
    [number, InterfaceType],
    vscode.TextEditorDecorationType
  >;

  constructor(private config: Config) {
    this.jumpCodeImages = new Cache<[string, InterfaceType], vscode.Uri>(
      (code, t) => generateJumpCodeImage(config, code, t),
      (code, t) => `${t}(${code})`
    );

    this.decorationTypes = new Cache<
      [number, InterfaceType],
      vscode.TextEditorDecorationType
    >(
      (charsToOffsetToLeft, type) => {
        if (type === "primary") {
          const offset = -1.0 * charsToOffsetToLeft * config.decoration.width;

          return vscode.window.createTextEditorDecorationType({
            after: {
              margin: `0 0 0 ${offset}px`,
              height: `${this.config.decoration.height}px`,
              width: `${this.config.decoration.width}px`,
            },
          });
        } else {
          return vscode.window.createTextEditorDecorationType({
            after: {
              margin: `0 0 0 0px`,
              height: `${this.config.decoration.height}px`,
              width: `${this.config.decoration.width}px`,
            },
          });
        }
      },
      (num, t) => `${t}(${num})`
    );
  }

  update = (config: Config) => {
    this.config = config;
    this.jumpCodeImages.reset();
    this.decorationTypes.reset();
  };

  async getUserSelection(
    editor: vscode.TextEditor,
    jumpLocations: JumpLocations,
    interfaceType: InterfaceType
  ): Promise<UserSelection> {
    if (jumpLocations.length === 0) return { tag: "Cancelled" };

    this.addDecorations(editor, jumpLocations, interfaceType);

    const input = await readKey();

    this.removeDecorations(editor);
    if (jumpLocations.length === 0) return { tag: "None" };

    if (input === undefined) {
      return { tag: "Cancelled" };
    }

    const loc = jumpLocations.find((x) => x.jumpCode === input);

    if (loc) {
      return { tag: "Ok", userSelection: loc };
    }

    return { tag: "None" };
  }

  private addDecorations(
    editor: vscode.TextEditor,
    jumpLocations: JumpLocations,
    interfaceType: InterfaceType
  ) {
    const { _true: standardOptions, _false: optionsWithNoSpaceToLeft } =
      linqish(jumpLocations)
        .map((loc) =>
          this.createDecorationOptions(
            loc.position.line,
            loc.position.character,
            loc.jumpCode,
            interfaceType
          )
        )
        .partition((loc) => loc.range.start.character > 0);

    editor.setDecorations(
      this.decorationTypes.get(1, interfaceType),
      standardOptions
    );
    editor.setDecorations(
      this.decorationTypes.get(0, interfaceType),
      optionsWithNoSpaceToLeft
    );
  }

  removeDecorations(editor: vscode.TextEditor) {
    for (const dec of this.decorationTypes) {
      if (dec === null) continue;

      editor.setDecorations(dec, []);
      dec.dispose();
    }

    this.decorationTypes.reset();
  }

  private createDecorationOptions = (
    line: number,
    char: number,
    code: string,
    interfaceType: InterfaceType
  ): vscode.DecorationOptions => {
    return {
      range: new vscode.Range(line, char, line, char),
      renderOptions: {
        dark: {
          after: {
            contentIconPath: this.jumpCodeImages.get(code, interfaceType),
          },
        },
        light: {
          after: {
            contentIconPath: this.jumpCodeImages.get(code, interfaceType),
          },
        },
      },
    };
  };
}
