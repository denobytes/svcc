import { parse as argparse } from "https://deno.land/std@0.181.0/flags/mod.ts";
import { compile } from "npm:svelte@^4.0.4/compiler";

const args = argparse(Deno.args, {
  boolean: [
    // instructions for this script
    "help",

    // output css
    "s",
    "css",

    // output js
    "j",
    "js",
  ],
  string: [
    // compiler options
    "options",

    // output type
    "type",
    "t",
  ],
});

const commandName = `svcc`;

const usageMessage = `
Usage: ${commandName} [OPTIONS] [-o OUTPUT-FILE] [SVELTE-FILE]
Compile a svelte file to js or css output

Options:
  --help              Show this help message

  -j, --js            Shorthand for --type js
  -s, --css           Shorthand for --type css
  -o, --output NAME   Write output to NAME
  -t, --type TYPE     Output type (ast, css, js)
  --options JSON      Options (JSON) for svelte compiler

  Examples:
  ${commandName} -j App.svelte
  ${commandName} -s App.svelte
  ${commandName} -t js App.svelte
  ${commandName} -o a.out App.svelte
  ${commandName} -t js -o a.out App.svelte
  cat App.svelte | ${commandName}
`;

// parse args
const help = args.help;
const readStdin = args._.length == 0;
const outputFilename = args.output || args.o;
const compileOptions = args.options
const outputType = args.type || args.t;

let outputJS = args.js || args.j;
let outputCSS = args.css || args.s;
let outputAST = false;
let compileStr = "";
let opts = {};

if (help) {
  console.log(usageMessage);
  Deno.exit();
}

if (compileOptions) {
  console.log(compileOptions);
	opts = JSON.parse(compileOptions);
  console.log(opts);
}

if (readStdin) {
  const decoder = new TextDecoder();
  for await (const chunk of Deno.stdin.readable) {
    const textChunk = decoder.decode(chunk);
    compileStr += textChunk;
  }
} else {
  const inputFilename = args._.at(0);

  compileStr = await Deno.readTextFile(inputFilename);
}

let compiledResult = compile(compileStr,opts);
let result = "";

// only one output type
if (outputType) {
  if (outputJS || outputCSS) {
    console.log(usageMessage);
    Deno.exit();
  }
  if (outputType == "js") {
    outputJS = true;
  } else if (outputType == "css") {
    outputCSS = true;
  } else if (outputType == "ast") {
    outputAST = true;
  } else {
    console.log(usageMessage);
    Deno.exit();
  }
}

if (outputJS) {
  result = compiledResult.js.code;
} else if (outputCSS) {
  result = compiledResult.css.code;
} else {
  result = compiledResult;
}

if (outputFilename) {
  try {
    if (outputAST) {
      result = JSON.stringify(result);
    }
    Deno.writeTextFileSync(outputFilename, result);
  } catch (e) {
    console.log(result);
  }
} else {
  console.log(result);
}
