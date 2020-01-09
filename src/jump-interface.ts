import * as vscode from "vscode";
import { Config } from "./config";
import { JumpLocations, JumpLocation } from "./common";
import { InlineInput } from "./inline-input";

export class JumpInterface {
  public charDecorationType!: vscode.TextEditorDecorationType;

  constructor(
    private config: Config,
    private cache: { [index: string]: vscode.Uri },
    private decorations: {
      [index: number]: vscode.TextEditorDecorationType;
    } = {}
  ) {}

  initialize = (config: Config) => {
    this.config = config;
    this.updateCache();
    this.charDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: "rgba(0,255,0,0.3)",
      borderWidth: "2px",
      borderStyle: "solid",
      light: {
        // this color will be used in light color themes
        borderColor: "rgba(0,255,0,0.3)"
      },
      dark: {
        // this color will be used in dark color themes
        borderColor: "rgba(0,255,0,0.3)"
      }
    });
  };

  async pick(
    editor: vscode.TextEditor,
    jumpLocations: JumpLocations
  ): Promise<JumpLocation | undefined> {
    this.addDecorations(editor, jumpLocations);

    const choice = await this.getUserChoice(editor, jumpLocations);

    this.removeDecorations(editor);

    return choice;
  }

  private async getUserChoice(
    editor: vscode.TextEditor,
    jumpLocations: JumpLocations
  ): Promise<JumpLocation | undefined> {
    const input = await new InlineInput().show(editor, v => v);

    for (const loc of jumpLocations.forwardLocations) {
      if (loc.jumpCode === input) {
        return loc;
      }
    }

    for (const loc of jumpLocations.backwardLocations) {
      if (loc.jumpCode === input) {
        return loc;
      }
    }
  }

  private addDecorations(
    editor: vscode.TextEditor,
    jumpLocations: JumpLocations
  ) {
    let decorationType = this.createTextEditorDecorationType(1);
    let decorationType2 = this.createTextEditorDecorationType(2);

    let options: vscode.DecorationOptions[] = [];
    let options2: vscode.DecorationOptions[] = [];

    for (const loc of jumpLocations.forwardLocations) {
      let code = loc.jumpCode;
      let len = code.length;

      let option: vscode.DecorationOptions;

      if (len === 1) {
        option = this.createDecorationOptions(
          loc.lineNumber,
          loc.charIndex,
          loc.charIndex,
          code
        );
        options.push(option);
      } else {
        option = this.createDecorationOptions(
          loc.lineNumber,
          loc.charIndex,
          loc.charIndex + len,
          code
        );
        options2.push(option);
      }
    }

    for (const loc of jumpLocations.backwardLocations) {
      let code = loc.jumpCode;
      let len = code.length;

      let option: vscode.DecorationOptions;

      if (len === 1) {
        option = this.createDecorationOptions(
          loc.lineNumber,
          loc.charIndex,
          loc.charIndex,
          code
        );
        options.push(option);
      } else {
        option = this.createDecorationOptions(
          loc.lineNumber,
          loc.charIndex,
          loc.charIndex + len,
          code
        );
        options2.push(option);
      }
    }

    editor.setDecorations(decorationType, options);
    editor.setDecorations(decorationType2, options2);
  }

  removeDecorations(editor: vscode.TextEditor) {
    for (var dec in this.decorations) {
      if (this.decorations[dec] === null) continue;
      editor.setDecorations(this.decorations[dec], []);
      this.decorations[dec].dispose();
      this.decorations[dec] = null!;
    }
  }

  private createTextEditorDecorationType(charsToOffset: number) {
    let decorationType = this.decorations[charsToOffset];
    if (decorationType) return decorationType;

    decorationType = vscode.window.createTextEditorDecorationType({
      after: {
        margin: `0 0 0 ${charsToOffset * -this.config.decoration.width}px`,
        height: `${this.config.decoration.height}px`,
        width: `${charsToOffset * this.config.decoration.width}px`
      }
    });

    this.decorations[charsToOffset] = decorationType;

    return decorationType;
  }

  private createDecorationOptions = (
    line: number,
    startCharacter: number,
    endCharacter: number,
    code: string
  ): vscode.DecorationOptions => {
    return {
      range: new vscode.Range(line, startCharacter, line, endCharacter),
      renderOptions: {
        dark: {
          after: {
            contentIconPath: this.getUri(code)
          }
        },
        light: {
          after: {
            contentIconPath: this.getUri(code)
          }
        }
      }
    };
  };

  private getUri = (code: string) => {
    if (this.cache[code] != undefined) return this.cache[code];
    this.cache[code] = this.buildUri(code);
    return this.cache[code];
  };

  private updateCache = () => {
    this.cache = {};
    this.config.jumper.characters.forEach(
      code => (this.cache[code] = this.buildUri(code))
    );
  };

  private buildUri = (code: string) => {
    let cf = this.config.decoration;
    let key = this.config.decoration.upperCase
      ? code.toUpperCase()
      : code.toLowerCase();
    let width = code.length * cf.width;
    let colors = cf.bgColor.split(",");
    let bgColor = colors[(code.length - 1) % colors.length];
    let svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${cf.height}" height="${cf.height}" width="${width}"><rect width="${width}" height="${cf.height}" rx="2" ry="3" style="fill: ${bgColor};fill-opacity:${cf.bgOpacity};stroke:${cf.borderColor};stroke-opacity:${cf.bgOpacity};"/><text font-family="${cf.fontFamily}" font-weight="${cf.fontWeight}" font-size="${cf.fontSize}px" style="fill:${cf.color}" x="${cf.x}" y="${cf.y}">${key}</text></svg>`;
    return vscode.Uri.parse(svg);
  };
}
