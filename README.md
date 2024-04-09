<h1 id="title">Obsidian universal renderer</h1>

<img src="https://github.com/dgudim/obsidian-universal-renderer/blob/master/assets/icon.png" height=150 id="icon"></img>
<img src="https://github.com/dgudim/obsidian-universal-renderer/blob/master/assets/thumb.png" height=0 id="thumb"></img>

> [!Warning]
> I made this plugin for myself, it may now work properly on other systems and it lacks fancy GUI settings

Render various diagrams and generate dynamic svgs in [Obsidian](https://obsidian.md). (Similar to [Obsidian kroki](https://github.com/gregzuro/obsidian-kroki))

> [!Note]
> This plugin uses system packages for diagram rendering (`js` ports are *slow*, I wanted something native)

## Supported diagrams
| Diagram | Doc | Codeblock tag |
| - | - | - |
| graphviz | [graphviz.org](https://graphviz.org/) | dot |
| latex | [latex-project.org](https://www.latex-project.org/) | latex |
| ditaa | [ditaa.sourceforge.net](https://ditaa.sourceforge.net/) | ditaa |
| blockdiag | [blockdiag.com](http://blockdiag.com/en/) | blockdiag |
| asciidoc | [asciidoc.org](http://asciidoc.org) | asciidoc |
| plantuml | [plantuml.com](http://plantuml.com/) | plantuml |
| typst | [typst.app](https://typst.app/) | typst |

### Special diagrams

| Diagram | Doc | Codeblock tag | 
| - | - | - |
| refgraph | [refgraph](#refgraph) | refgraph |
| dynamic-svg | [dynamic svg](#dynamic-svg) | dynamic-svg |

## Installation

### From the releases

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `<VaultFolder>/.obsidian/plugins/obsidian-universal-renderer/` from the releases section

### Manually

- Clone this repository
- `npm i` or `yarn` to install dependencies
- `npm run build`
- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `<VaultFolder>/.obsidian/plugins/obsidian-universal-renderer/`.
- Install `graphviz, latex, asciidoc` and other packages via your system package manager (you can customize executable file locations in plugin settings)

### Via BRAT

- Install the BRAT plugin via Community Plugin Search
- [Read the docs](https://tfthacker.com/BRAT)
- Add https://github.com/dgudim/obsidian-universal-renderer

Alternatively, you can also use [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin

## Usage
- Create a fenced codeblock using one of the diagram types supported by renderer as the language (See a list of [supported diagrams](#supported-diagrams))
- Use [graph parameters](#graph-parameters) to customize the *appearance* of the graph
- Specify your diagram code inside the codeblock

## Customizing diagram colors

1. Open `palattegen.ts` 
2. Modify `colors` and `shades` constants to your liking (default theme is gruvbox)
3. Rebuild the plugin
4. Delete `styles.css`
5. Reenable the plugin/restart obsidian **2** times

## Graph parameters

Various parameters can be specified before the diagram code similar to *obsidian's frontmatter* 

### Available parameters

| Paramater | Description |
| - | - |
| width | Width of the rendered graph, can be any `css` size modifier (%, px, em, etc.) |
| doc-start | String to prepend to the diagram code before rendering (usefull with presets) | 
| doc-end | Same as `doc-start` but appends instead of prepending |
| ref-name <br> graph-name <br> name | Set graph name for reusing it later via a [ref graph](#refgraph) |
| preset | A set of parameters to apply to the graph (See [presets](#presets)) |
| invert-shade <br> invert-color | Inverts shades or colors of the graph |
| \<svg tag\>-**fill**/**stroke**:keep-**shade**/**color**/**all** | Freezes *color* or *shade* inversion in light/dark theme for a specific svg tag (e.g. circle, text, line) |

### Example

````sh
```
---
invert-shade:1
width:90%
text-fill:keep-shade
---
<diagram code>
```
````

## Presets

By default there **2** explicit presets defined

| Preset | Description |
| - | - |
| math-graph | Looks good on graphviz graphs with white nodes (sets `ellipse` and `text` fill mode to `keep-shade`) | 
| default-tikz | Appends some boilerplate via `doc-start` and `doc-end` parameters (See `processor.ts` for preset parameters) |

There are also presets which are applied by default

| Preset | Description |
| - | - |
| default-latex | Applied to all `latex` graphs, adds some boilerplate start and end code |
| default-plantuml | Applied to all `plantuml` graphs, adds `@startuml` and `@enduml` to the start and end of the code respectively | 

### Defining a preset 

1. open `processors.ts`
2. Modify `presets` constant to your liking, presets can contain any [graph parameters](#graph-parameters)
3. Rebuild the plugin

> [!Note]
> Presets starting with `default-`<[diagram type](#supported-diagrams)> will be applied by default to that diagram type

## Refgraph

A special diagram type, usefull for reducing code duplication, just displays an already rendered graph

Syntax is as follows:
````sh
```refgraph
<graph name>
```
````

Graph name is set by a `name`/`ref-name`/`graph-name` parameter (See [graph parameters](#graph-parameters))

## Dynamic svg

This is not even a graph, the aim of this codeblock is to make your svgs follow the defined color scheme (For example you have a black svg and it looks bad in dark theme)
 
Syntax and example:
````ruby
```dynamic-svg
---
invert-shade
width:100%
---
[[file name]]
```
````

Here we take some svg, make it follow the color scheme (See [customizing diagram colors](#customizing-diagram-colors)) and invert it's shades (black to white, etc.)

> [!Note]
> This doesn't work well for non-optimized large svgs or with complex svgs
