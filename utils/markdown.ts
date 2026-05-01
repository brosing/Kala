import { Parser } from "htmlparser2";

// Performance Optimization: Hoist regular expressions to module-level constants
// to avoid the overhead of recompiling the regex on every function call.
const REGEX_MD_ESCAPE = /([\\`*_{}[\]()#+.!<>|~-])/g;
const REGEX_NEWLINES = /\n{3,}/g;

export function escapeMarkdown(text: string): string {
  // Escapes characters that have special meaning in Markdown
  // https://daringfireball.net/projects/markdown/syntax#backslash
  // Also escapes < and > to prevent HTML injection.
  // GFM: | (tables), ~ (strikethrough)
  return text.replace(REGEX_MD_ESCAPE, "\\$1");
}

export function htmlToMarkdown(html: string): string {
  if (!html) return "";

  let markdown = "";
  let inScriptOrStyle = false;

  const parser = new Parser(
    {
      onopentag(name) {
        if (inScriptOrStyle) return;

        switch (name.toLowerCase()) {
          case "script":
          case "style":
          case "iframe":
          case "object":
            inScriptOrStyle = true;
            break;
          case "b":
          case "strong":
            markdown += "**";
            break;
          case "i":
          case "em":
            markdown += "*";
            break;
          case "h1":
            markdown += "# ";
            break;
          case "h2":
            markdown += "## ";
            break;
          case "h3":
            markdown += "### ";
            break;
          case "h4":
            markdown += "#### ";
            break;
          case "h5":
            markdown += "##### ";
            break;
          case "h6":
            markdown += "###### ";
            break;
          case "p":
            // Regex removed <p>, added \n\n on </p>.
            break;
          case "br":
            markdown += "\n";
            break;
          case "li":
            markdown += "- ";
            break;
          case "blockquote":
            markdown += "> ";
            break;
          case "ul":
          case "ol":
            markdown += "\n";
            break;
        }
      },
      ontext(text) {
        if (inScriptOrStyle) return;
        markdown += escapeMarkdown(text);
      },
      onclosetag(name) {
        const lowerName = name.toLowerCase();
        if (["script", "style", "iframe", "object"].includes(lowerName)) {
          inScriptOrStyle = false;
          return;
        }
        if (inScriptOrStyle) return;

        switch (name.toLowerCase()) {
          case "b":
          case "strong":
            markdown += "**";
            break;
          case "i":
          case "em":
            markdown += "*";
            break;
          case "h1":
          case "h2":
          case "h3":
          case "h4":
          case "h5":
          case "h6":
            markdown += "\n\n";
            break;
          case "p":
            markdown += "\n\n";
            break;
          case "ul":
          case "ol":
            markdown += "\n";
            break;
          case "li":
            markdown += "\n";
            break;
          case "blockquote":
            markdown += "\n\n";
            break;
        }
      },
    },
    { decodeEntities: true },
  );

  parser.write(html);
  parser.end();

  // Normalize newlines
  return markdown.replace(REGEX_NEWLINES, "\n\n").trim();
}
