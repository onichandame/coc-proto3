# coc-proto3

*forked from [this vscode extension][vscode]*

coc.nvim extension for protobuf. Features include:

- [x] go-to definition
- [x] compile proto
- [] syntax checking
- [] format
- [] symbole provider

## Install

`:CocInstall @onichandame/coc-proto3`

## Configurations

```json5
{
  "coc-proto3.compileOnSave": true, # compile proto file on save
  "coc-proto3.protoc": {
    "path": "/usr/bin/protoc", # default to "protoc" in PATH
    "options": [
      "--js_out=./out", # has to be set if compile commands are used
    ]
  }
}
```

## Commands

- `proto3.compile.one`: compile the current proto file
- `proto3.compile.all`: compile all the proto files at current workspace

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)

[vscode]: https://github.com/zxh0/vscode-proto3/
