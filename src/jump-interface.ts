import * as vscode from "vscode";
import { JumpLocations, JumpLocation, linqish, Cache } from "./common";
import { readKey } from "./inline-input";
import { Config } from "./config";

type InterfaceType = "primary" | "secondary";

export class JumpInterface {
  private jumpCodeImages: Cache<[string, InterfaceType], vscode.Uri>;
  private decorationTypes: Cache<[number], vscode.TextEditorDecorationType>;

  constructor(private config: Config) {
    this.jumpCodeImages = new Cache<[string, InterfaceType], vscode.Uri>(
      (code, t) => this.buildUri(code, t)
    );
    this.jumpCodeImages.getCacheKey = (code, t) => `${t}(${code})`;

    this.decorationTypes = new Cache<[number], vscode.TextEditorDecorationType>(
      charsToOffsetToLeft =>
        vscode.window.createTextEditorDecorationType({
          after: {
            margin: `0 0 0 ${charsToOffsetToLeft *
              -this.config.decoration.width}px`,
            height: `${this.config.decoration.height}px`,
            width: `${charsToOffsetToLeft * this.config.decoration.width}px`
          }
        })
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
  ): Promise<JumpLocation | undefined> {
    this.addDecorations(editor, jumpLocations, interfaceType);

    const input = await readKey();

    this.removeDecorations(editor);

    return jumpLocations.find(x => x.jumpCode === input);
  }

  private addDecorations(
    editor: vscode.TextEditor,
    jumpLocations: JumpLocations,
    interfaceType: InterfaceType
  ) {
    const {
      _true: standardOptions,
      _false: optionsWithNoSpaceToLeft
    } = linqish(jumpLocations)
      .map(loc =>
        this.createDecorationOptions(
          loc.lineNumber,
          loc.charIndex,
          loc.jumpCode,
          interfaceType
        )
      )
      .partition(loc => loc.range.start.character > 0);

    editor.setDecorations(this.decorationTypes.get(1), standardOptions);
    editor.setDecorations(
      this.decorationTypes.get(0),
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
            contentIconPath: this.jumpCodeImages.get(code, interfaceType)
          }
        },
        light: {
          after: {
            contentIconPath: this.jumpCodeImages.get(code, interfaceType)
          }
        }
      }
    };
  };

  private buildUri = (code: string, interfaceType: InterfaceType) => {
    const cf = this.config.decoration;
    const key = this.config.decoration.upperCase
      ? code.toUpperCase()
      : code.toLowerCase();
    const width = code.length * cf.width;
    const bgColor =
      interfaceType === "primary"
        ? cf.backgroundColor
        : cf.secondaryBackgroundColor;

    const svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${cf.height}" height="${cf.height}" width="${width}"><rect width="${width}" height="${cf.height}" rx="4" ry="4" style="fill:${bgColor};fill-opacity:1;stroke:${cf.borderColor};stroke-opacity:${cf.backgroundOpacity};"/><text font-family="${cf.fontFamily}" font-weight="${cf.fontWeight}" font-size="${cf.fontSize}px" style="fill:${cf.color}" x="${cf.x}" y="${cf.y}">${key}</text></svg>`;

    return vscode.Uri.parse(svg);
  };
}
