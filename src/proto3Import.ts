'use strict';

import path from 'path';
import vscode from 'coc.nvim';

export module Proto3Import {
  export const importStatementRegex = new RegExp(/^\s*import\s+('|")(.+\.proto)('|")\s*;\s*$/gim);

  export const getImportedFilePathsOnDocument = (document: vscode.TextDocument) => {
    const fullDocument = document.getText();
    let importStatement: ReturnType<typeof importStatementRegex['exec']>;
    let importPaths: string[] = [];
    while ((importStatement = importStatementRegex.exec(fullDocument))) {
      const protoFileName = importStatement[2];
      const searchPath = path.join(vscode.workspace.root, '**', protoFileName);
      importPaths.push(searchPath);
    }
    return importPaths;
  };
}
