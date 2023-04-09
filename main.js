/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => GraphvizPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian2 = require("obsidian");

// src/setting.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  dotPath: "dot",
  pdflatexPath: "pdflatex",
  pdf2svgPath: "pdf2svg",
  blockdiagPath: "blockdiag",
  ditaaPath: "ditaa",
  asciidocPath: "asciidoctor",
  plantumlPath: "plantuml"
};
var GraphvizSettingsTab = class extends import_obsidian.PluginSettingTab {
  constructor(plugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    let setting;
    for (setting in DEFAULT_SETTINGS) {
      new import_obsidian.Setting(containerEl).setName(setting).addText(
        (text) => text.setPlaceholder(DEFAULT_SETTINGS[setting]).setValue(this.plugin.settings[setting]).onChange(
          async (value) => {
            this.plugin.settings[setting] = value;
            await this.plugin.saveSettings();
          }
        )
      );
    }
  }
};

// src/processors.ts
var os = __toESM(require("os"));
var path = __toESM(require("path"));
var fs2 = __toESM(require("fs"));
var import_child_process = require("child_process");
var crypto = __toESM(require("crypto"));

// src/utils.ts
var fs = __toESM(require("fs"));
var hexExtractRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
function readFileString(path2) {
  return fs.readFileSync(path2).toString();
}
function insertStr(str, start, newSubStr) {
  return str.slice(0, start) + newSubStr + str.slice(start);
}
function rgb100ToHex(colors) {
  let hexString = "#";
  for (const color of colors) {
    const component = Math.floor(parseInt(color) / 100 * 255).toString(16);
    hexString += component.length == 1 ? `0${component}` : component;
  }
  return hexString;
}
function hexToRgb(color) {
  const colors = hexExtractRegex.exec(color);
  return colors ? {
    r: parseInt(colors[1], 16),
    g: parseInt(colors[2], 16),
    b: parseInt(colors[3], 16)
  } : void 0;
}
function getMagnitudeColorDelta(color1, color2) {
  return Math.abs(color1.r - color2.r) + Math.abs(color1.g - color2.g) + Math.abs(color1.b - color2.b);
}
function getColorDelta(color1, color2) {
  return {
    r: color2.r - color1.r,
    g: color2.g - color1.g,
    b: color2.b - color1.b
  };
}
function findClosestColorVar(targetColor, colorMap) {
  let minimumDelta = Infinity;
  let closestColorVar = "";
  let closestColor = targetColor;
  for (const [colorRgb, colorVar] of colorMap) {
    const delta = getMagnitudeColorDelta(targetColor, colorRgb);
    if (delta < minimumDelta) {
      minimumDelta = delta;
      closestColorVar = colorVar;
      closestColor = colorRgb;
    }
  }
  return {
    var: closestColorVar,
    foundColor: closestColor,
    delta: minimumDelta
  };
}
function isDefined(val) {
  return !(val === void 0 || val === null);
}
function invertColorName(color) {
  if (color === void 0) {
    return void 0;
  }
  if (color.contains("light")) {
    return color.replace("light", "dark");
  } else {
    return color.replace("dark", "light");
  }
}

// src/processors.ts
var md5 = (contents) => crypto.createHash("md5").update(contents).digest("hex");
var renderTypes = [
  "dot",
  "latex",
  "ditaa",
  "blockdiag",
  "asciidoc",
  "refgraph",
  "dynamic-svg",
  "plantuml"
];
var svgTags = ["text", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon"];
var svgStyleTags = ["fill", "stroke"];
var regQotedStr = `(?:"|').*?(?:"|')`;
var svgStyleRegex = new RegExp(`(?:${svgStyleTags.join("|")})=${regQotedStr}`, "g");
var rgbRegex = /rgb\(|\)| |%/g;
var propertyNameRegex = /.*=|"|'/g;
var svgColors = [
  // dark colors
  [[
    ["darkred", "#8B0000"],
    // intuitive
    ["firebrick", "#B22222"],
    ["maroon", "#800000"],
    ["brown", "#A52A2A"]
  ], "--g-color-dark-red"],
  [[
    ["darkmagenta", "#8B008B"],
    ["darkviolet", "#9400D3"],
    ["darkorchid", "#9932CC"],
    ["blueviolet", "#8A2BE2"],
    ["indigo", "#4B0082"]
  ], "--g-color-dark-purple"],
  [[
    ["darkgreen", "#006400"]
  ], "--g-color-dark-green"],
  [[
    ["darkblue", "#00008B"],
    // intuitive
    ["midnightblue", "#191970"],
    ["navy", "#000080"]
  ], "--g-color-dark-blue"],
  [[
    ["chocolate", "#D2691E"]
  ], "--g-color-dark-orange"],
  [[
    ["goldenrod", "#DAA520"],
    ["darkgoldenrod", "#B8860B"]
  ], "--g-color-dark-yellow"],
  [[
    ["darkcyan", "#008B8B"],
    // intuitive
    ["lightseagreen", "#20B2AA"],
    ["teal", "#008080"]
  ], "--g-color-dark-cyan"],
  // neutral colors
  [[
    ["red", "#FF0000"],
    // intuitive
    ["tomato", "#FF6347"]
  ], "--g-color-red"],
  [[
    ["purple", "#800080"],
    // intuitive
    ["mediumpurple", "#9370DB"],
    ["magenta", "#FF00FF"]
  ], "--g-color-purple"],
  [[
    ["green", "#008000"]
  ], "--g-color-green"],
  // intuitive
  [[
    ["blue", "#0000FF"]
  ], "--g-color-blue"],
  // intuitive
  [[
    ["darkorange", "#FF8C00"]
  ], "--g-color-orange"],
  [[
    ["yellow", "#FFFF00"]
  ], "--g-color-yellow"],
  // intuitive
  [[
    ["cyan", "aqua", "#00FFFF"]
  ], "--g-color-cyan"],
  // intuitive
  // light colors
  [[
    ["lightcoral", "#F08080"],
    ["salmon", "#FA8072"],
    ["pink", "#FFC0CB"],
    ["lightsalmon", "#FFA07A"],
    ["indianred", "#CD5C5C"]
  ], "--g-color-light-red"],
  [[
    ["plum", "#DDA0DD"],
    ["violet", "#EE82EE"],
    ["magenta", "#DA70D6"],
    ["mediumorchid", "#BA55D3"]
  ], "--g-color-light-purple"],
  [[
    ["lightgreen", "#90EE90"],
    // intuitive
    ["palegreen", "#98FB98"]
  ], "--g-color-light-green"],
  [[
    ["powderblue", "#B0E0E6"],
    ["lightblue", "#ADD8E6"],
    // intuitive
    ["skyblue", "#87CEEB"],
    ["lightskyblue", "#87CEFA"]
  ], "--g-color-light-blue"],
  [[
    ["orange", "#FFA500"],
    ["coral", "#FF7F50"]
  ], "--g-color-light-orange"],
  [[
    ["gold", "#FFD700"]
  ], "--g-color-light-yellow"],
  [[
    ["paleturquoise", "#AFEEEE"],
    ["aquamarine", "#7FFFD4"]
  ], "--g-color-light-cyan"]
];
var colorToVar;
var rgbColorToVar;
var svgShades = [
  // gray colors
  [[
    ["ghostwhite", "#F8F8FF"]
  ], "--g-color-light100-hard"],
  // #F9F5D7
  [[
    ["white", "#FFFFFF"]
  ], "--g-color-light100"],
  // #FBF1C7
  [[
    ["seashell", "#FFF5EE"]
  ], "--g-color-light100-soft"],
  // #F2E5BC
  [[
    ["snow", "#FFFAFA"]
  ], "--g-color-light90"],
  // #EBDBB2                    
  [[
    ["whitesmoke", "#F5F5F5"]
  ], "--g-color-light80"],
  // #D5C4A1
  [[
    ["lightgray", "lightgrey", "#D3D3D3"]
  ], "--g-color-light70"],
  // #BDAE93
  [[
    ["silver", "#C0C0C0"]
  ], "--g-color-light60"],
  // #A89984
  //['--g-color-dark100-hard']                     // #1D2021 unused
  [[
    ["black", "#000000"]
  ], "--g-color-dark100"],
  // #282828           
  [[
    ["dimgray", "dimgrey", "#696969"]
  ], "--g-color-dark100-soft"],
  // #32302F
  [[
    ["darkslategray", "darkslategrey", "#2F4F4F"]
  ], "--g-color-dark90"],
  // #3C3836
  [[
    ["slategray", "slategrey", "#708090"]
  ], "--g-color-dark80"],
  // #504945
  [[
    ["lightslategray", "lightslategrey", "#778899"]
  ], "--g-color-dark70"],
  // #665C54
  [[
    ["gray", "grey", "#808080"]
  ], "--g-color-dark60"],
  // #7C6F64
  [[
    ["darkgray", "darkgrey", "#A9A9A9"]
  ], "--g-color-gray"]
  // #928374
];
var shadeToVar;
var rgbShadeToVar;
var presets = /* @__PURE__ */ new Map([
  ["math-graph", /* @__PURE__ */ new Map([
    ["ellipse-fill", "keep-shade"],
    ["text-fill", "keep-shade"]
  ])],
  ["default-latex", /* @__PURE__ */ new Map([
    ["inverted", "true"],
    ["width", "100%"],
    ["doc-start", "\\documentclass[preview,class=article]{standalone}"],
    ["doc-end", "\\end{document}"]
  ])],
  ["default-tikz", /* @__PURE__ */ new Map([
    ["inverted", "true"],
    ["width", "100%"],
    ["doc-start", "\\documentclass[tikz]{standalone}\\usepackage{tikz}\\begin{document}"],
    ["doc-end", "\\end{document}"]
  ])],
  ["default-plantuml", /* @__PURE__ */ new Map([
    ["inverted", "true"],
    ["width", "100%"],
    ["doc-start", "@startuml"],
    ["doc-end", "@enduml"]
  ])]
]);
function transformColorMap(colorList) {
  const colorToVar2 = /* @__PURE__ */ new Map();
  const rgbToVar = /* @__PURE__ */ new Map();
  for (const entry of colorList) {
    const colorVar = entry[1];
    for (const colorEntries of entry[0]) {
      for (const color of colorEntries) {
        if (color.startsWith("#")) {
          rgbToVar.set(hexToRgb(color), colorVar);
        }
        colorToVar2.set(color.toLowerCase(), colorVar);
      }
    }
  }
  return {
    colorToVar: colorToVar2,
    hexToVar: rgbToVar
  };
}
function mapColor(sourceColor, findClosestColor) {
  if (!isDefined(shadeToVar)) {
    const transformed = transformColorMap(svgShades);
    shadeToVar = transformed.colorToVar;
    rgbShadeToVar = transformed.hexToVar;
  }
  if (!isDefined(colorToVar)) {
    const transformed = transformColorMap(svgColors);
    colorToVar = transformed.colorToVar;
    rgbColorToVar = transformed.hexToVar;
  }
  let colorVar = colorToVar.get(sourceColor);
  let shadeVar = shadeToVar.get(sourceColor);
  let delta = 0;
  let deltaColor = void 0;
  const sourceRgbColor = hexToRgb(sourceColor);
  if (!isDefined(colorVar) && !isDefined(shadeVar) && isDefined(sourceRgbColor) && findClosestColor) {
    const closestColor = findClosestColorVar(sourceRgbColor, rgbColorToVar);
    const closestShade = findClosestColorVar(sourceRgbColor, rgbShadeToVar);
    if (closestColor.delta < closestShade.delta) {
      colorVar = closestColor.var;
      delta = closestColor.delta;
      deltaColor = getColorDelta(sourceRgbColor, closestColor.foundColor);
    } else {
      shadeVar = closestShade.var;
      delta = closestShade.delta;
      deltaColor = getColorDelta(sourceRgbColor, closestShade.foundColor);
    }
  }
  if (isDefined(colorVar)) {
    return {
      colorVar,
      type: "color",
      delta,
      deltaColor,
      sourceColor: sourceRgbColor
    };
  } else if (isDefined(shadeVar)) {
    return {
      colorVar: shadeVar,
      type: "shade",
      delta,
      deltaColor,
      sourceColor: sourceRgbColor
    };
  }
  return {
    colorVar: void 0,
    type: "unknown",
    delta: 0,
    deltaColor: void 0,
    sourceColor: sourceRgbColor
  };
}
function getTempDir(type) {
  return path.join(os.tmpdir(), `obsidian-${type}`);
}
var Processors = class {
  constructor(plugin) {
    this.referenceGraphMap = /* @__PURE__ */ new Map();
    this.pluginSettings = plugin.settings;
    this.vaultAdapter = plugin.app.vault.adapter;
    this.metadataCache = plugin.app.metadataCache;
  }
  getRendererParameters(type, inputFile, outputFile) {
    switch (type) {
      case "dot":
        return {
          execParams: [
            {
              path: this.pluginSettings.dotPath,
              options: ["-Tsvg", inputFile, "-o", outputFile]
            }
          ],
          skipDynamicSvg: false
        };
      case "latex":
        return {
          execParams: [
            {
              path: this.pluginSettings.pdflatexPath,
              options: ["-shell-escape", "-output-directory", getTempDir(type), inputFile]
            },
            {
              path: this.pluginSettings.pdf2svgPath,
              options: [`${inputFile}.pdf`, outputFile]
            }
          ],
          skipDynamicSvg: false
        };
      case "ditaa":
        return {
          execParams: [
            {
              path: this.pluginSettings.ditaaPath,
              options: [inputFile, "--transparent", "--svg", "--overwrite"]
            }
          ],
          skipDynamicSvg: false
        };
      case "blockdiag":
        return {
          execParams: [
            {
              path: this.pluginSettings.blockdiagPath,
              options: ["--antialias", "-Tsvg", inputFile, "-o", outputFile]
            }
          ],
          skipDynamicSvg: false
        };
      case "asciidoc":
        return {
          execParams: [
            {
              path: this.pluginSettings.asciidocPath,
              options: ["-e", inputFile, "-o", outputFile]
            }
          ],
          skipDynamicSvg: true
        };
      case "plantuml":
        return {
          execParams: [
            {
              path: this.pluginSettings.plantumlPath,
              options: ["-nbthread", "auto", "-failfast2", "-tsvg", "-nometadata", "-overwrite", inputFile]
            }
          ],
          skipDynamicSvg: false
        };
      default:
        return {
          execParams: [],
          skipDynamicSvg: true
        };
    }
  }
  getProcessorForType(type) {
    return (source, el, ctx) => {
      return this.imageProcessor(source, el, ctx, type);
    };
  }
  spawnProcess(cmdPath, parameters) {
    return new Promise((resolve, reject) => {
      console.debug(`Starting external process ${cmdPath}, ${parameters}`);
      const process = (0, import_child_process.spawn)(cmdPath, parameters);
      let errData = "";
      process.stderr.on("data", (data) => {
        errData += data;
      });
      process.on("error", (err) => reject(`"${cmdPath} ${parameters}" failed, ${err}`));
      process.stdin.end();
      process.on("exit", (code) => {
        if (code !== 0) {
          return reject(`"${cmdPath} ${parameters}" failed, error code: ${code}, stderr: ${errData}`);
        }
        resolve("ok");
      });
    });
  }
  async writeRenderedFile(inputFile, outputFile, type, conversionParams) {
    const renderer = this.getRendererParameters(type, inputFile, outputFile);
    for (const process of renderer.execParams) {
      await this.spawnProcess(process.path, process.options);
    }
    const renderedContent = readFileString(outputFile);
    if (!renderer.skipDynamicSvg) {
      const svg = this.makeDynamicSvg(renderedContent, conversionParams);
      fs2.writeFileSync(outputFile, svg.svgData);
      return svg;
    }
    return {
      svgData: renderedContent,
      extras: conversionParams
    };
  }
  makeDynamicSvg(svgSource, conversionParams) {
    const width = conversionParams.get("width");
    if (width) {
      svgSource = svgSource.replace("<svg", `<svg style="width: ${width}" `);
    }
    const svgStart = svgSource.indexOf("<svg") + 4;
    let currentIndex;
    for (const svgTag of svgTags) {
      currentIndex = svgStart;
      while (true) {
        currentIndex = svgSource.indexOf(`<${svgTag}`, currentIndex);
        if (currentIndex == -1) {
          break;
        }
        currentIndex += svgTag.length + 2;
        const styleSubstring = svgSource.substring(currentIndex, svgSource.indexOf(">", currentIndex));
        let newStyle = 'style="';
        let additionalTag = "";
        for (const svgStyleTag of svgStyleTags) {
          const tagStyle = styleSubstring.match(`${svgStyleTag}=${regQotedStr}`);
          if (!(tagStyle == null ? void 0 : tagStyle.length) && svgStyleTag == "stroke" && !conversionParams.get(`${svgTag}-implicit-stroke`)) {
            continue;
          }
          let tagColor = (tagStyle == null ? void 0 : tagStyle.length) ? tagStyle[0].replaceAll(propertyNameRegex, "") : "black";
          if (tagColor.startsWith("rgb")) {
            tagColor = rgb100ToHex(tagColor.replaceAll(rgbRegex, "").split(","));
          }
          const params = (conversionParams.get(`${svgTag}-${svgStyleTag}`) || "").split(",");
          if (params.contains("skip")) {
            newStyle += `${svgStyleTag}:${tagColor};`;
            continue;
          }
          const rcolor = mapColor(tagColor, !params.contains("original-colors"));
          if (!rcolor.colorVar) {
            newStyle += `${svgStyleTag}:${tagColor};`;
            continue;
          }
          for (const param of params) {
            switch (param) {
              case "keep-color":
                additionalTag = 'class="keep-color"';
                break;
              case "keep-shade":
                additionalTag = 'class="keep-shade"';
                break;
              case "keep-all":
                additionalTag = 'class="keep-color keep-shade"';
                break;
              case "invert-color":
                if (rcolor.type === "color") {
                  rcolor.colorVar = invertColorName(rcolor.colorVar);
                }
                break;
              case "invert-shade":
                if (rcolor.type === "shade") {
                  rcolor.colorVar = invertColorName(rcolor.colorVar);
                }
                break;
              case "invert-all":
                rcolor.colorVar = invertColorName(rcolor.colorVar);
                break;
            }
          }
          const mixMultiplier = parseFloat(conversionParams.get("mix-multiplier") || "0");
          if (mixMultiplier && rcolor.delta) {
            const mixMode = conversionParams.get("mix-mode") || "";
            const inverseMixMultiplier = 1 - mixMultiplier;
            switch (mixMode) {
              case "mix":
                const col = rcolor.sourceColor;
                newStyle += `${svgStyleTag}:rgb(
                                    clamp(0, calc(${col.r * mixMultiplier} + ${inverseMixMultiplier} * var(${rcolor.colorVar}_r)), 255), 
                                    clamp(0, calc(${col.g * mixMultiplier} + ${inverseMixMultiplier} * var(${rcolor.colorVar}_g)), 255), 
                                    clamp(0, calc(${col.b * mixMultiplier} + ${inverseMixMultiplier} * var(${rcolor.colorVar}_b)), 255))`;
                break;
              case "delta":
              default:
                const cdlt = rcolor.deltaColor;
                newStyle += `${svgStyleTag}:rgb(
                                    clamp(0, calc(var(${rcolor.colorVar}_r) + ${cdlt.r * mixMultiplier}), 255), 
                                    clamp(0, calc(var(${rcolor.colorVar}_g) + ${cdlt.g * mixMultiplier}), 255), 
                                    clamp(0, calc(var(${rcolor.colorVar}_b) + ${cdlt.b * mixMultiplier}), 255))`;
            }
          } else {
            newStyle += `${svgStyleTag}:var(${rcolor.colorVar});`;
          }
        }
        newStyle += `" ${additionalTag} `;
        svgSource = insertStr(svgSource, currentIndex, newStyle);
      }
    }
    svgSource = svgSource.replaceAll(svgStyleRegex, "");
    return {
      svgData: svgSource,
      extras: conversionParams
    };
  }
  loadPreset(presetName, conversionParams) {
    const preset = presets.get(presetName);
    if (preset) {
      for (const [preset_key, preset_value] of preset) {
        conversionParams.set(preset_key, preset_value);
      }
    }
  }
  preprocessSource(type, source, outputFile) {
    const conversionParams = /* @__PURE__ */ new Map();
    this.loadPreset(`default-${type}`, conversionParams);
    if (source.startsWith("---")) {
      const lastIndex = source.indexOf("---", 3);
      const frontMatter = source.substring(3, lastIndex);
      const parameters = frontMatter.trim().split("\n");
      for (const parameter of parameters) {
        const parameter_split = parameter.split(":");
        if (parameter_split.length == 1) {
          parameter_split.push("1");
        }
        const parameter_name = parameter_split[0].trim();
        const parameter_value = parameter_split[1].trim();
        if (parameter_name === "preset") {
          this.loadPreset(parameter_value, conversionParams);
        } else {
          conversionParams.set(parameter_name, parameter_value);
        }
      }
      source = source.substring(lastIndex + 3);
    }
    for (const [param_key, param_value] of conversionParams) {
      switch (param_key) {
        case "ref-name":
        case "graph-name":
        case "name":
          this.referenceGraphMap.set(param_value, {
            sourcePath: outputFile,
            extras: conversionParams
          });
          break;
        case "doc-start":
          source = param_value + "\n" + source;
          break;
        case "doc-end":
          source = source + "\n" + param_value;
      }
    }
    return {
      source,
      extras: conversionParams
    };
  }
  async renderImage(type, source) {
    var _a;
    if (type === "refgraph") {
      const graphData2 = this.referenceGraphMap.get(source.trim());
      if (!graphData2) {
        throw Error(`Graph with name ${source} does not exist`);
      }
      return {
        svgData: readFileString(graphData2.sourcePath),
        extras: graphData2.extras
      };
    }
    const temp_dir = getTempDir(type);
    const graph_hash = md5(source);
    const inputFile = path.join(temp_dir, graph_hash);
    const outputFile = `${inputFile}.svg`;
    if (!fs2.existsSync(temp_dir)) {
      fs2.mkdirSync(temp_dir);
    }
    const graphData = this.preprocessSource(type, source, outputFile);
    if (type === "dynamic-svg") {
      graphData.source = graphData.source.trim();
      const resolvedLink = (_a = this.metadataCache.getFirstLinkpathDest(graphData.source.slice(2, -2), "")) == null ? void 0 : _a.path;
      if (!resolvedLink) {
        throw Error(`Invalid link: ${graphData.source}`);
      }
      return this.makeDynamicSvg((await this.vaultAdapter.read(resolvedLink)).toString(), graphData.extras);
    }
    if (!fs2.existsSync(inputFile)) {
      fs2.writeFileSync(inputFile, graphData.source);
    } else if (fs2.existsSync(outputFile)) {
      return {
        svgData: readFileString(outputFile),
        extras: graphData.extras
      };
    }
    return this.writeRenderedFile(inputFile, outputFile, type, graphData.extras);
  }
  async imageProcessor(source, el, _, type) {
    try {
      console.debug(`Call image processor for ${type}`);
      const image = await this.renderImage(type, source.trim());
      el.classList.add(image.extras.get("inverted") ? "multi-graph-inverted" : "multi-graph-normal");
      el.innerHTML = image.svgData;
    } catch (errMessage) {
      console.error("convert to image error: " + errMessage);
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.setText(errMessage);
      pre.appendChild(code);
      el.appendChild(pre);
    }
  }
};

// src/main.ts
var GraphvizPlugin = class extends import_obsidian2.Plugin {
  async onload() {
    console.debug("Load universal renderer plugin");
    await this.loadSettings();
    this.addSettingTab(new GraphvizSettingsTab(this));
    const processors = new Processors(this);
    this.app.workspace.onLayoutReady(() => {
      for (const type of renderTypes) {
        this.registerMarkdownCodeBlockProcessor(type, processors.getProcessorForType(type).bind(processors));
      }
    });
  }
  onunload() {
    console.debug("Unload universal renderer plugin");
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    return Promise.resolve();
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
