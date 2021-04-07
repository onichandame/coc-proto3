import vscode from 'coc.nvim';
import path from 'path';
import cp from 'child_process';

import { Proto3Configuration } from './proto3Configuration';

export class Proto3Compiler {
  private _config: Proto3Configuration;
  private _isProtocInPath: boolean;

  constructor(workspaceFolder?: vscode.WorkspaceFolder) {
    this._config = Proto3Configuration.Instance(workspaceFolder);
    try {
      cp.execFileSync('protoc', ['-h']);
      this._isProtocInPath = true;
    } catch (e) {
      this._isProtocInPath = false;
    }
  }

  public async compileAllProtos() {
    let args = this._config.getProtocOptions();
    // Compile in batch produces errors. Must be 1 by 1.
    (await this._config.getAllProtoPaths()).forEach((proto) => {
      vscode.window.showMessage(proto);
      this.runProtoc(args.concat(proto), undefined, (_, stderr) => {
        if (stderr) vscode.window.showErrorMessage(stderr);
      });
    });
  }

  public compileAProto(doc: vscode.TextDocument) {
    if (doc.languageId == 'proto') {
      let fileName = path.basename(doc.uri.split(`file://`).splice(1, Number.MAX_VALUE).join(``));
      let args = this._config.getProtocOptions().concat(fileName);

      this.runProtoc(args, undefined, (_, stderr) => {
        if (stderr) vscode.window.showErrorMessage(stderr);
      });
    }
  }

  public compileProtoToTmp(fileName: string, callback?: (stderr: string) => void) {
    let proto = path.relative(vscode.workspace.root, fileName);

    let args = this._config.getProtoPathOptions().concat(proto);

    this.runProtoc(args, undefined, (_, stderr) => {
      if (callback) {
        callback(stderr);
      }
    });
  }

  private runProtoc(args: string[], opts?: cp.ExecFileOptions, callback?: (stdout: string, stderr: string) => void) {
    let protocPath = this._config.getProtocPath(this._isProtocInPath);
    if (protocPath === '?') {
      return; // protoc is not configured
    }

    opts = Object.assign({}, opts, { cwd: vscode.workspace.root });
    cp.execFile(protocPath, args, opts, (err, stdout, stderr) => {
      if (err && stdout.length == 0 && stderr.length == 0) {
        // Assume the OS error if no messages to buffers because
        // "err" does not provide error type info.
        vscode.window.showErrorMessage(err.message);
        console.error(err);
        return;
      }
      if (callback) {
        callback(stdout, stderr);
      }
    });
  }
}
