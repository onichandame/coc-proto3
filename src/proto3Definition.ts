import fs from 'fs';
import path from 'path';
import vscode from 'coc.nvim';
import fg from 'fast-glob';

import { getWordAtPosition } from './utils';
import { guessScope, Proto3ScopeKind } from './proto3ScopeGuesser';
import { Proto3Import } from './proto3Import';
import { Proto3Primitive } from './proto3Primitive';

export class Proto3DefinitionProvider implements vscode.DefinitionProvider {
  public provideDefinition: vscode.DefinitionProvider['provideDefinition'] = async (document, position) => {
    const scope = guessScope(document, position.line);
    if (scope.kind === Proto3ScopeKind.Comment) {
      return;
    }

    const targetDefinition = getWordAtPosition(document, position);

    if (Proto3Primitive.isTypePrimitive(targetDefinition)) {
      return;
    }

    const lineText = document.getText(vscode.Range.create(position.line, 0, position.line, Number.MAX_VALUE));

    const importRegExp = new RegExp(`^\\s*import\\s+(\'|")((\\w+\/)*${targetDefinition})(\'|")\\s*;.*$`, 'i');
    const matchedGroups = importRegExp.exec(lineText);
    if (matchedGroups && matchedGroups.length === 5) {
      const importFilePath = matchedGroups[2];
      const location = this.findImportDefinition(importFilePath);
      if (location) {
        return location;
      }
      vscode.window.showErrorMessage(`Could not find ${targetDefinition} definition.`);
    }
    const messageOrEnumPattern = `\\s*(\\w+\\.)*\\w+\\s*`;
    const messageFieldPattern = `\\s+\\w+\\s*=\\s*\\d+;.*`;
    const rpcReqOrRspPattern = `\\s*\\(\\s*(stream\\s+)?${messageOrEnumPattern}\\s*\\)\\s*`;
    const lineEndPattern = `\\n*$`;

    const messageRegExp = new RegExp(
      `^\\s*(repeated){0,1}(${messageOrEnumPattern})${messageFieldPattern}${lineEndPattern}`,
      'i'
    );
    const messageInMap = new RegExp(
      `^\\s*map\\s*<${messageOrEnumPattern},${messageOrEnumPattern}>${messageFieldPattern}${lineEndPattern}`,
      'i'
    );
    const messageInRpcRegExp = new RegExp(
      //`^\\s*rpc\\s*\\w+${rpcReqOrRspPattern}returns${rpcReqOrRspPattern}[;{].*$`,
      `^\\s*rpc\\s*\\w+${rpcReqOrRspPattern}returns`,
      'i'
    );

    if (messageRegExp.test(lineText) || messageInRpcRegExp.test(lineText) || messageInMap.test(lineText)) {
      const location = this.findEnumOrMessageDefinition(document, targetDefinition);
      if (location) {
        return location;
      }
      vscode.window.showErrorMessage(`Could not find ${targetDefinition} definition.`);
    }

    return;
  };

  private async findEnumOrMessageDefinition(
    document: vscode.TextDocument,
    target: string
  ): Promise<vscode.Location | undefined> {
    const searchPaths = Proto3Import.getImportedFilePathsOnDocument(document);

    const files = [
      document.uri
        .split(/file:\/\//)
        .splice(1, Number.MAX_VALUE)
        .join(``),
      ...(await fg(searchPaths)),
    ];

    for (const file of files) {
      const data = fs.readFileSync(file.toString());
      const lines = data.toString().split('\n');
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const messageDefinitionRegexMatch = new RegExp(`\\s*(message|enum)\\s*${target}\\s*{`).exec(line);
        if (messageDefinitionRegexMatch && messageDefinitionRegexMatch.length) {
          const uri = vscode.Uri.file(file.toString());
          const range = this.getTargetLocationInline(lineIndex, line, target, messageDefinitionRegexMatch);
          return vscode.Location.create(uri.toString(), range);
        }
      }
    }
  }

  private async findImportDefinition(importFileName: string): Promise<vscode.Location> {
    const files = await fg(path.join(vscode.workspace.root, '**', importFileName));
    const importPath = files[0].toString();
    // const data = fs.readFileSync(importPath);
    // const lines = data.toString().split('\n');
    // const lastLine = lines[lines.length  - 1];
    const uri = vscode.Uri.file(importPath);
    const definitionStartPosition = vscode.Position.create(0, 0);
    const definitionEndPosition = vscode.Position.create(0, 0);
    const range = vscode.Range.create(definitionStartPosition, definitionEndPosition);
    return vscode.Location.create(uri.toString(), range);
  }

  private getTargetLocationInline(
    lineIndex: number,
    line: string,
    target: string,
    definitionRegexMatch: RegExpExecArray
  ): vscode.Range {
    const matchedStr = definitionRegexMatch[0];
    const index = line.indexOf(matchedStr) + matchedStr.indexOf(target);
    const definitionStartPosition = vscode.Position.create(lineIndex, index);
    const definitionEndPosition = vscode.Position.create(lineIndex, index + target.length);
    return vscode.Range.create(definitionStartPosition, definitionEndPosition);
  }
}
