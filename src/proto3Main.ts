import * as path from 'path';

import vscode from 'coc.nvim';
import cp from 'child_process';
import { PROTO3_MODE } from './proto3Mode';

export function activate(ctx: vscode.ExtensionContext): void {
  vscode.languages.setLanguageConfiguration(PROTO3_MODE.language, {
    indentationRules: {
      // ^(.*\*/)?\s*\}.*$
      decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
      // ^.*\{[^}'']*$
      increaseIndentPattern: /^.*\{[^}'']*$/,
    },
    wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)(\.proto){0,1}/g,
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/'],
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
      ['<', '>'],
    ],

    __electricCharacterSupport: {
      brackets: [
        { tokenType: 'delimiter.curly.ts', open: '{', close: '}', isElectric: true },
        { tokenType: 'delimiter.square.ts', open: '[', close: ']', isElectric: true },
        { tokenType: 'delimiter.paren.ts', open: '(', close: ')', isElectric: true },
      ],
    },

    __characterPairSupport: {
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '`', close: '`', notIn: ['string'] },
        { open: '"', close: '"', notIn: ['string'] },
        { open: "'", close: "'", notIn: ['string', 'comment'] },
      ],
    },
  });

  vscode.languages.registerDocumentFormattingEditProvider('proto3', {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
      let args = [];
      let opts = { input: document.getText() };

      // In order for clang-format to find the correct formatting file we need to have cwd set appropriately
      switch (document.uri.scheme) {
        case 'untitled': // File has not yet been saved to disk use workspace path
          opts['cwd'] = vscode.workspace.rootPath;
          args.push(`--assume-filename=untitled.proto`);
          break;
        case 'file': // File is on disk use it's directory
          opts['cwd'] = path.dirname(document.uri.fsPath);
          args.push(`--assume-filename=${document.uri.fsPath}`);
          break;
      }

      let style = vscode.workspace.getConfiguration('clang-format', document).get<string>('style');
      style = style && style.trim();
      if (style) args.push(`-style=${style}`);

      let stdout = cp.execFileSync('clang-format', args, opts);
      return [
        new vscode.TextEdit(
          document.validateRange(new vscode.Range(0, 0, Infinity, Infinity)),
          stdout ? stdout.toString() : '',
        ),
      ];
    },
  });
}

function deactivate() {
  //
}
