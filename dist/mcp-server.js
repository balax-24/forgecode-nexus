"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/EditorMcpServer.ts
var fs2 = __toESM(require("fs"));
var path = __toESM(require("path"));
var import_child_process = require("child_process");

// node_modules/diff/lib/index.mjs
function Diff() {
}
Diff.prototype = {
  diff: function diff(oldString, newString) {
    var _options$timeout;
    var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    var callback = options.callback;
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    this.options = options;
    var self = this;
    function done(value) {
      if (callback) {
        setTimeout(function() {
          callback(void 0, value);
        }, 0);
        return true;
      } else {
        return value;
      }
    }
    oldString = this.castInput(oldString);
    newString = this.castInput(newString);
    oldString = this.removeEmpty(this.tokenize(oldString));
    newString = this.removeEmpty(this.tokenize(newString));
    var newLen = newString.length, oldLen = oldString.length;
    var editLength = 1;
    var maxEditLength = newLen + oldLen;
    if (options.maxEditLength) {
      maxEditLength = Math.min(maxEditLength, options.maxEditLength);
    }
    var maxExecutionTime = (_options$timeout = options.timeout) !== null && _options$timeout !== void 0 ? _options$timeout : Infinity;
    var abortAfterTimestamp = Date.now() + maxExecutionTime;
    var bestPath = [{
      oldPos: -1,
      lastComponent: void 0
    }];
    var newPos = this.extractCommon(bestPath[0], newString, oldString, 0);
    if (bestPath[0].oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
      return done([{
        value: this.join(newString),
        count: newString.length
      }]);
    }
    var minDiagonalToConsider = -Infinity, maxDiagonalToConsider = Infinity;
    function execEditLength() {
      for (var diagonalPath = Math.max(minDiagonalToConsider, -editLength); diagonalPath <= Math.min(maxDiagonalToConsider, editLength); diagonalPath += 2) {
        var basePath = void 0;
        var removePath = bestPath[diagonalPath - 1], addPath = bestPath[diagonalPath + 1];
        if (removePath) {
          bestPath[diagonalPath - 1] = void 0;
        }
        var canAdd = false;
        if (addPath) {
          var addPathNewPos = addPath.oldPos - diagonalPath;
          canAdd = addPath && 0 <= addPathNewPos && addPathNewPos < newLen;
        }
        var canRemove = removePath && removePath.oldPos + 1 < oldLen;
        if (!canAdd && !canRemove) {
          bestPath[diagonalPath] = void 0;
          continue;
        }
        if (!canRemove || canAdd && removePath.oldPos + 1 < addPath.oldPos) {
          basePath = self.addToPath(addPath, true, void 0, 0);
        } else {
          basePath = self.addToPath(removePath, void 0, true, 1);
        }
        newPos = self.extractCommon(basePath, newString, oldString, diagonalPath);
        if (basePath.oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
          return done(buildValues(self, basePath.lastComponent, newString, oldString, self.useLongestToken));
        } else {
          bestPath[diagonalPath] = basePath;
          if (basePath.oldPos + 1 >= oldLen) {
            maxDiagonalToConsider = Math.min(maxDiagonalToConsider, diagonalPath - 1);
          }
          if (newPos + 1 >= newLen) {
            minDiagonalToConsider = Math.max(minDiagonalToConsider, diagonalPath + 1);
          }
        }
      }
      editLength++;
    }
    if (callback) {
      (function exec2() {
        setTimeout(function() {
          if (editLength > maxEditLength || Date.now() > abortAfterTimestamp) {
            return callback();
          }
          if (!execEditLength()) {
            exec2();
          }
        }, 0);
      })();
    } else {
      while (editLength <= maxEditLength && Date.now() <= abortAfterTimestamp) {
        var ret = execEditLength();
        if (ret) {
          return ret;
        }
      }
    }
  },
  addToPath: function addToPath(path2, added, removed, oldPosInc) {
    var last = path2.lastComponent;
    if (last && last.added === added && last.removed === removed) {
      return {
        oldPos: path2.oldPos + oldPosInc,
        lastComponent: {
          count: last.count + 1,
          added,
          removed,
          previousComponent: last.previousComponent
        }
      };
    } else {
      return {
        oldPos: path2.oldPos + oldPosInc,
        lastComponent: {
          count: 1,
          added,
          removed,
          previousComponent: last
        }
      };
    }
  },
  extractCommon: function extractCommon(basePath, newString, oldString, diagonalPath) {
    var newLen = newString.length, oldLen = oldString.length, oldPos = basePath.oldPos, newPos = oldPos - diagonalPath, commonCount = 0;
    while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(newString[newPos + 1], oldString[oldPos + 1])) {
      newPos++;
      oldPos++;
      commonCount++;
    }
    if (commonCount) {
      basePath.lastComponent = {
        count: commonCount,
        previousComponent: basePath.lastComponent
      };
    }
    basePath.oldPos = oldPos;
    return newPos;
  },
  equals: function equals(left, right) {
    if (this.options.comparator) {
      return this.options.comparator(left, right);
    } else {
      return left === right || this.options.ignoreCase && left.toLowerCase() === right.toLowerCase();
    }
  },
  removeEmpty: function removeEmpty(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }
    return ret;
  },
  castInput: function castInput(value) {
    return value;
  },
  tokenize: function tokenize(value) {
    return value.split("");
  },
  join: function join(chars) {
    return chars.join("");
  }
};
function buildValues(diff2, lastComponent, newString, oldString, useLongestToken) {
  var components = [];
  var nextComponent;
  while (lastComponent) {
    components.push(lastComponent);
    nextComponent = lastComponent.previousComponent;
    delete lastComponent.previousComponent;
    lastComponent = nextComponent;
  }
  components.reverse();
  var componentPos = 0, componentLen = components.length, newPos = 0, oldPos = 0;
  for (; componentPos < componentLen; componentPos++) {
    var component = components[componentPos];
    if (!component.removed) {
      if (!component.added && useLongestToken) {
        var value = newString.slice(newPos, newPos + component.count);
        value = value.map(function(value2, i) {
          var oldValue = oldString[oldPos + i];
          return oldValue.length > value2.length ? oldValue : value2;
        });
        component.value = diff2.join(value);
      } else {
        component.value = diff2.join(newString.slice(newPos, newPos + component.count));
      }
      newPos += component.count;
      if (!component.added) {
        oldPos += component.count;
      }
    } else {
      component.value = diff2.join(oldString.slice(oldPos, oldPos + component.count));
      oldPos += component.count;
      if (componentPos && components[componentPos - 1].added) {
        var tmp = components[componentPos - 1];
        components[componentPos - 1] = components[componentPos];
        components[componentPos] = tmp;
      }
    }
  }
  var finalComponent = components[componentLen - 1];
  if (componentLen > 1 && typeof finalComponent.value === "string" && (finalComponent.added || finalComponent.removed) && diff2.equals("", finalComponent.value)) {
    components[componentLen - 2].value += finalComponent.value;
    components.pop();
  }
  return components;
}
var characterDiff = new Diff();
var extendedWordChars = /^[A-Za-z\xC0-\u02C6\u02C8-\u02D7\u02DE-\u02FF\u1E00-\u1EFF]+$/;
var reWhitespace = /\S/;
var wordDiff = new Diff();
wordDiff.equals = function(left, right) {
  if (this.options.ignoreCase) {
    left = left.toLowerCase();
    right = right.toLowerCase();
  }
  return left === right || this.options.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right);
};
wordDiff.tokenize = function(value) {
  var tokens = value.split(/([^\S\r\n]+|[()[\]{}'"\r\n]|\b)/);
  for (var i = 0; i < tokens.length - 1; i++) {
    if (!tokens[i + 1] && tokens[i + 2] && extendedWordChars.test(tokens[i]) && extendedWordChars.test(tokens[i + 2])) {
      tokens[i] += tokens[i + 2];
      tokens.splice(i + 1, 2);
      i--;
    }
  }
  return tokens;
};
var lineDiff = new Diff();
lineDiff.tokenize = function(value) {
  if (this.options.stripTrailingCr) {
    value = value.replace(/\r\n/g, "\n");
  }
  var retLines = [], linesAndNewlines = value.split(/(\n|\r\n)/);
  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
    linesAndNewlines.pop();
  }
  for (var i = 0; i < linesAndNewlines.length; i++) {
    var line = linesAndNewlines[i];
    if (i % 2 && !this.options.newlineIsToken) {
      retLines[retLines.length - 1] += line;
    } else {
      if (this.options.ignoreWhitespace) {
        line = line.trim();
      }
      retLines.push(line);
    }
  }
  return retLines;
};
function diffLines(oldStr, newStr, callback) {
  return lineDiff.diff(oldStr, newStr, callback);
}
var sentenceDiff = new Diff();
sentenceDiff.tokenize = function(value) {
  return value.split(/(\S.+?[.!?])(?=\s+|$)/);
};
var cssDiff = new Diff();
cssDiff.tokenize = function(value) {
  return value.split(/([{}:;,]|\s+)/);
};
function _typeof(obj) {
  "@babel/helpers - typeof";
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function(obj2) {
      return typeof obj2;
    };
  } else {
    _typeof = function(obj2) {
      return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
    };
  }
  return _typeof(obj);
}
function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}
function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}
function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
var objectPrototypeToString = Object.prototype.toString;
var jsonDiff = new Diff();
jsonDiff.useLongestToken = true;
jsonDiff.tokenize = lineDiff.tokenize;
jsonDiff.castInput = function(value) {
  var _this$options = this.options, undefinedReplacement = _this$options.undefinedReplacement, _this$options$stringi = _this$options.stringifyReplacer, stringifyReplacer = _this$options$stringi === void 0 ? function(k, v) {
    return typeof v === "undefined" ? undefinedReplacement : v;
  } : _this$options$stringi;
  return typeof value === "string" ? value : JSON.stringify(canonicalize(value, null, null, stringifyReplacer), stringifyReplacer, "  ");
};
jsonDiff.equals = function(left, right) {
  return Diff.prototype.equals.call(jsonDiff, left.replace(/,([\r\n])/g, "$1"), right.replace(/,([\r\n])/g, "$1"));
};
function canonicalize(obj, stack, replacementStack, replacer, key) {
  stack = stack || [];
  replacementStack = replacementStack || [];
  if (replacer) {
    obj = replacer(key, obj);
  }
  var i;
  for (i = 0; i < stack.length; i += 1) {
    if (stack[i] === obj) {
      return replacementStack[i];
    }
  }
  var canonicalizedObj;
  if ("[object Array]" === objectPrototypeToString.call(obj)) {
    stack.push(obj);
    canonicalizedObj = new Array(obj.length);
    replacementStack.push(canonicalizedObj);
    for (i = 0; i < obj.length; i += 1) {
      canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack, replacer, key);
    }
    stack.pop();
    replacementStack.pop();
    return canonicalizedObj;
  }
  if (obj && obj.toJSON) {
    obj = obj.toJSON();
  }
  if (_typeof(obj) === "object" && obj !== null) {
    stack.push(obj);
    canonicalizedObj = {};
    replacementStack.push(canonicalizedObj);
    var sortedKeys = [], _key;
    for (_key in obj) {
      if (obj.hasOwnProperty(_key)) {
        sortedKeys.push(_key);
      }
    }
    sortedKeys.sort();
    for (i = 0; i < sortedKeys.length; i += 1) {
      _key = sortedKeys[i];
      canonicalizedObj[_key] = canonicalize(obj[_key], stack, replacementStack, replacer, _key);
    }
    stack.pop();
    replacementStack.pop();
  } else {
    canonicalizedObj = obj;
  }
  return canonicalizedObj;
}
var arrayDiff = new Diff();
arrayDiff.tokenize = function(value) {
  return value.slice();
};
arrayDiff.join = arrayDiff.removeEmpty = function(value) {
  return value;
};
function structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  if (!options) {
    options = {};
  }
  if (typeof options.context === "undefined") {
    options.context = 4;
  }
  var diff2 = diffLines(oldStr, newStr, options);
  if (!diff2) {
    return;
  }
  diff2.push({
    value: "",
    lines: []
  });
  function contextLines(lines) {
    return lines.map(function(entry) {
      return " " + entry;
    });
  }
  var hunks = [];
  var oldRangeStart = 0, newRangeStart = 0, curRange = [], oldLine = 1, newLine = 1;
  var _loop = function _loop2(i2) {
    var current = diff2[i2], lines = current.lines || current.value.replace(/\n$/, "").split("\n");
    current.lines = lines;
    if (current.added || current.removed) {
      var _curRange;
      if (!oldRangeStart) {
        var prev = diff2[i2 - 1];
        oldRangeStart = oldLine;
        newRangeStart = newLine;
        if (prev) {
          curRange = options.context > 0 ? contextLines(prev.lines.slice(-options.context)) : [];
          oldRangeStart -= curRange.length;
          newRangeStart -= curRange.length;
        }
      }
      (_curRange = curRange).push.apply(_curRange, _toConsumableArray(lines.map(function(entry) {
        return (current.added ? "+" : "-") + entry;
      })));
      if (current.added) {
        newLine += lines.length;
      } else {
        oldLine += lines.length;
      }
    } else {
      if (oldRangeStart) {
        if (lines.length <= options.context * 2 && i2 < diff2.length - 2) {
          var _curRange2;
          (_curRange2 = curRange).push.apply(_curRange2, _toConsumableArray(contextLines(lines)));
        } else {
          var _curRange3;
          var contextSize = Math.min(lines.length, options.context);
          (_curRange3 = curRange).push.apply(_curRange3, _toConsumableArray(contextLines(lines.slice(0, contextSize))));
          var hunk = {
            oldStart: oldRangeStart,
            oldLines: oldLine - oldRangeStart + contextSize,
            newStart: newRangeStart,
            newLines: newLine - newRangeStart + contextSize,
            lines: curRange
          };
          if (i2 >= diff2.length - 2 && lines.length <= options.context) {
            var oldEOFNewline = /\n$/.test(oldStr);
            var newEOFNewline = /\n$/.test(newStr);
            var noNlBeforeAdds = lines.length == 0 && curRange.length > hunk.oldLines;
            if (!oldEOFNewline && noNlBeforeAdds && oldStr.length > 0) {
              curRange.splice(hunk.oldLines, 0, "\\ No newline at end of file");
            }
            if (!oldEOFNewline && !noNlBeforeAdds || !newEOFNewline) {
              curRange.push("\\ No newline at end of file");
            }
          }
          hunks.push(hunk);
          oldRangeStart = 0;
          newRangeStart = 0;
          curRange = [];
        }
      }
      oldLine += lines.length;
      newLine += lines.length;
    }
  };
  for (var i = 0; i < diff2.length; i++) {
    _loop(i);
  }
  return {
    oldFileName,
    newFileName,
    oldHeader,
    newHeader,
    hunks
  };
}

// src/DiffManager.ts
var DiffManager = class _DiffManager {
  /**
   * Compute unified diff hunks between original and proposed content.
   */
  static computeHunks(filePath, originalContent, proposedContent) {
    const patch = structuredPatch(
      filePath,
      filePath,
      originalContent,
      proposedContent,
      "original",
      "proposed",
      { context: 3 }
    );
    const hunks = patch.hunks.map((h, idx) => {
      const oldLinesContent = [];
      const newLinesContent = [];
      for (const line of h.lines) {
        if (line.startsWith("-")) {
          oldLinesContent.push(line.substring(1));
        } else if (line.startsWith("+")) {
          newLinesContent.push(line.substring(1));
        } else {
          oldLinesContent.push(line.substring(1));
          newLinesContent.push(line.substring(1));
        }
      }
      return {
        id: `hunk_${filePath.replace(/[^a-zA-Z0-9]/g, "_")}_${idx + 1}`,
        filePath,
        oldStart: h.oldStart,
        oldLines: h.oldLines,
        newStart: h.newStart,
        newLines: h.newLines,
        oldContent: oldLinesContent.join("\n"),
        newContent: newLinesContent.join("\n"),
        status: "pending"
      };
    });
    return {
      filePath,
      originalContent,
      proposedContent,
      hunks
    };
  }
  /**
   * Apply a specific hunk to the base file content.
   */
  static applyHunk(content, hunk) {
    const lines = content.split("\n");
    const startIdx = Math.max(0, hunk.oldStart - 1);
    const deleteCount = hunk.oldLines;
    const replacementLines = hunk.newContent.split("\n");
    lines.splice(startIdx, deleteCount, ...replacementLines);
    return lines.join("\n");
  }
  /**
   * Reconstruct document content based on only the approved hunks.
   */
  static applyAcceptedHunks(plan) {
    let result = plan.originalContent;
    const sortedHunks = [...plan.hunks].sort((a, b) => b.oldStart - a.oldStart);
    for (const hunk of sortedHunks) {
      if (hunk.status === "accepted") {
        result = _DiffManager.applyHunk(result, hunk);
      }
    }
    return result;
  }
};

// src/UndoManager.ts
var fs = __toESM(require("fs"));
var import_events = require("events");
var UndoManager = class _UndoManager extends import_events.EventEmitter {
  transactionStack = [];
  static instance;
  constructor() {
    super();
  }
  static getInstance() {
    if (!_UndoManager.instance) {
      _UndoManager.instance = new _UndoManager();
    }
    return _UndoManager.instance;
  }
  /**
   * Capture file contents prior to applying a batch of hunks.
   */
  createTransaction(description, filePaths) {
    const snapshots = [];
    for (const fp of filePaths) {
      try {
        if (fs.existsSync(fp)) {
          const content = fs.readFileSync(fp, "utf8");
          snapshots.push({
            filePath: fp,
            content,
            timestamp: Date.now()
          });
        }
      } catch (err) {
        console.error(`[UndoManager] Failed to read pre-edit snapshot for ${fp}:`, err);
      }
    }
    const tx = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      description,
      timestamp: Date.now(),
      snapshots
    };
    return tx;
  }
  /**
   * Push a completed transaction onto the undo stack.
   */
  commitTransaction(tx) {
    if (tx.snapshots.length > 0) {
      this.transactionStack.push(tx);
      this.emit("stackChanged", this.canUndo());
      console.log(`[UndoManager] Committed transaction "${tx.description}" with ${tx.snapshots.length} file snapshots.`);
    }
  }
  /**
   * Check if any transaction is available to undo.
   */
  canUndo() {
    return this.transactionStack.length > 0;
  }
  /**
   * Get the description of the latest undoable transaction.
   */
  peekLastTransaction() {
    return this.transactionStack[this.transactionStack.length - 1];
  }
  /**
   * Revert all files in the latest transaction back to their pre-edit state.
   */
  async undoLastApply() {
    const tx = this.transactionStack.pop();
    if (!tx) {
      return {
        success: false,
        revertedFiles: [],
        message: "No actions to undo."
      };
    }
    const revertedFiles = [];
    try {
      for (const snap of tx.snapshots) {
        fs.writeFileSync(snap.filePath, snap.content, "utf8");
        revertedFiles.push(snap.filePath);
      }
      this.emit("stackChanged", this.canUndo());
      this.emit("undone", tx);
      const message = `Successfully reverted "${tx.description}" across ${revertedFiles.length} file(s). Workspace restored clean.`;
      console.log(`[UndoManager] ${message}`);
      return {
        success: true,
        revertedFiles,
        message
      };
    } catch (err) {
      const errorMsg = `Undo failed: ${err.message || String(err)}`;
      console.error(`[UndoManager] ${errorMsg}`);
      return {
        success: false,
        revertedFiles,
        message: errorMsg
      };
    }
  }
  /**
   * Clear the undo history (e.g., when a fresh session starts or tests reset).
   */
  clear() {
    this.transactionStack = [];
    this.emit("stackChanged", false);
  }
};

// src/EditorMcpServer.ts
var EditorMcpServer = class {
  workspaceRoot;
  pendingApprovals = /* @__PURE__ */ new Map();
  constructor(workspaceRoot2) {
    this.workspaceRoot = workspaceRoot2;
  }
  /**
   * Tool 1: workspace_search(query, filePattern)
   * Rapid regex search across workspace files.
   */
  async workspaceSearch(query, filePattern) {
    try {
      const results = [];
      const regex = new RegExp(query, "gi");
      const walk = (dir) => {
        if (results.length > 50) return;
        const entries = fs2.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (results.length > 50) return;
          const fullPath = path.join(dir, entry.name);
          const rel = path.relative(this.workspaceRoot, fullPath);
          if (entry.isDirectory()) {
            if (![".git", "node_modules", ".venv", "__pycache__", "dist"].includes(entry.name)) {
              walk(fullPath);
            }
          } else if (entry.isFile()) {
            if (filePattern && !rel.includes(filePattern)) continue;
            try {
              const content = fs2.readFileSync(fullPath, "utf8");
              const lines = content.split("\n");
              lines.forEach((line, idx) => {
                if (regex.test(line)) {
                  results.push(`${rel}:${idx + 1}: ${line.trim()}`);
                }
              });
            } catch (e) {
            }
          }
        }
      };
      walk(this.workspaceRoot);
      if (results.length === 0) {
        return { content: `No matches found for query "${query}".` };
      }
      return {
        content: `Found ${results.length} match(es):
` + results.slice(0, 50).join("\n")
      };
    } catch (err) {
      return { content: `Search failed: ${err.message}`, isError: true };
    }
  }
  /**
   * Tool 2: read_file_outline(filePath)
   * Inspect structural signatures and docstrings without consuming excessive tokens.
   */
  async readFileOutline(filePath) {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workspaceRoot, filePath);
    if (!fs2.existsSync(fullPath)) {
      return { content: `File not found: ${filePath}`, isError: true };
    }
    try {
      const content = fs2.readFileSync(fullPath, "utf8");
      const lines = content.split("\n");
      const outline = [];
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("def ") || trimmed.startsWith("class ") || trimmed.startsWith("async def ") || trimmed.startsWith("@") || trimmed.startsWith(".. ") || trimmed.startsWith("function ") || trimmed.startsWith("export ")) {
          outline.push(`Line ${idx + 1}: ${line}`);
        }
      });
      return {
        content: `File outline for ${filePath} (${lines.length} total lines):
` + outline.join("\n")
      };
    } catch (err) {
      return { content: `Failed to read outline: ${err.message}`, isError: true };
    }
  }
  /**
   * Tool 3: read_file_chunk(filePath, startLine, endLine)
   * Targeted line range reading.
   */
  async readFileChunk(filePath, startLine, endLine) {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workspaceRoot, filePath);
    if (!fs2.existsSync(fullPath)) {
      return { content: `File not found: ${filePath}`, isError: true };
    }
    try {
      const content = fs2.readFileSync(fullPath, "utf8");
      const lines = content.split("\n");
      const s = Math.max(1, startLine) - 1;
      const e = Math.min(lines.length, endLine);
      const chunk = lines.slice(s, e).map((line, idx) => `${s + idx + 1} | ${line}`).join("\n");
      return {
        content: `Lines ${s + 1} to ${e} of ${filePath}:
${chunk}`
      };
    } catch (err) {
      return { content: `Failed to read file chunk: ${err.message}`, isError: true };
    }
  }
  /**
   * Tool 4: propose_hunk_edits(filePath, hunks)
   * Staged hunk proposals. Suspends execution until user review & approval via TrueForge.
   */
  async proposeHunkEdits(filePath, hunks) {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workspaceRoot, filePath);
    let originalContent = "";
    const fileExists = fs2.existsSync(fullPath);
    if (fileExists) {
      originalContent = fs2.readFileSync(fullPath, "utf8");
    }
    let modifiedContent = originalContent;
    for (const h of hunks) {
      if (originalContent.includes(h.search)) {
        modifiedContent = modifiedContent.replace(h.search, h.replace);
      } else {
        if (!fileExists) {
          modifiedContent = h.replace;
        } else {
          return {
            content: `Failed to locate search block in ${filePath}:
"${h.search}"`,
            isError: true
          };
        }
      }
    }
    const plan = DiffManager.computeHunks(fullPath, originalContent, modifiedContent);
    return {
      content: `Proposed ${plan.hunks.length} diff hunk(s) for ${filePath}. Waiting for user review.`,
      requiresApproval: true,
      approvalData: {
        filePath: fullPath,
        plan
      }
    };
  }
  /**
   * Execute actual disk write when approved.
   */
  async applyApprovedPlan(plan) {
    try {
      const undoManager = UndoManager.getInstance();
      const tx = undoManager.createTransaction(`Agent applied edits to ${plan.filePath}`, [plan.filePath]);
      const finalContent = DiffManager.applyAcceptedHunks(plan);
      fs2.writeFileSync(plan.filePath, finalContent, "utf8");
      undoManager.commitTransaction(tx);
      return {
        content: `Successfully applied approved hunks to ${plan.filePath}. (Pre-edit state saved to UndoManager).`
      };
    } catch (err) {
      return { content: `Failed to write changes: ${err.message}`, isError: true };
    }
  }
  /**
   * Tool 5: run_terminal_command(command)
   * Executes verification commands (e.g. pytest tests/test_cli.py -q)
   */
  async runTerminalCommand(command) {
    return new Promise((resolve) => {
      (0, import_child_process.exec)(command, { cwd: this.workspaceRoot, timeout: 3e4 }, (error, stdout, stderr) => {
        const output = [
          stdout ? `STDOUT:
${stdout}` : "",
          stderr ? `STDERR:
${stderr}` : "",
          error ? `EXIT CODE: ${error.code || 1}` : "EXIT CODE: 0"
        ].filter(Boolean).join("\n\n");
        resolve({
          content: output,
          isError: !!error
        });
      });
    });
  }
};

// src/mcp-server.ts
var workspaceRoot = process.env.FORGECODE_WORKSPACE || process.cwd();
var server = new EditorMcpServer(workspaceRoot);
process.stdin.setEncoding("utf8");
var buffer = "";
process.stdin.on("data", async (chunk) => {
  buffer += chunk;
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const request = JSON.parse(line);
      const { id, method, params } = request;
      if (method === "initialize") {
        const response = {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: "forgecode-editor-mcp",
              version: "1.0.0"
            }
          }
        };
        process.stdout.write(JSON.stringify(response) + "\n");
      } else if (method === "ping") {
        const response = {
          jsonrpc: "2.0",
          id,
          result: {}
        };
        process.stdout.write(JSON.stringify(response) + "\n");
      } else if (method === "notifications/initialized") {
      } else if (method === "tools/list") {
        const response = {
          jsonrpc: "2.0",
          id,
          result: {
            tools: [
              {
                name: "workspace_search",
                description: "Search workspace code using regex or substring match",
                inputSchema: {
                  type: "object",
                  properties: {
                    query: { type: "string" },
                    filePattern: { type: "string" }
                  },
                  required: ["query"]
                }
              },
              {
                name: "read_file_outline",
                description: "Read top-level class and function symbols from a file",
                inputSchema: {
                  type: "object",
                  properties: {
                    filePath: { type: "string" }
                  },
                  required: ["filePath"]
                }
              },
              {
                name: "read_file_chunk",
                description: "Read a range of lines from a specific file",
                inputSchema: {
                  type: "object",
                  properties: {
                    filePath: { type: "string" },
                    startLine: { type: "number" },
                    endLine: { type: "number" }
                  },
                  required: ["filePath", "startLine", "endLine"]
                }
              },
              {
                name: "propose_hunk_edits",
                description: "Propose search/replace blocks for interactive review before disk write",
                inputSchema: {
                  type: "object",
                  properties: {
                    filePath: { type: "string" },
                    hunks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          search: { type: "string" },
                          replace: { type: "string" }
                        },
                        required: ["search", "replace"]
                      }
                    }
                  },
                  required: ["filePath", "hunks"]
                }
              },
              {
                name: "run_terminal_command",
                description: "Run tests or build commands in the workspace",
                inputSchema: {
                  type: "object",
                  properties: {
                    command: { type: "string" }
                  },
                  required: ["command"]
                }
              }
            ]
          }
        };
        process.stdout.write(JSON.stringify(response) + "\n");
      } else if (method === "tools/call") {
        const { name, arguments: args } = params;
        let result;
        switch (name) {
          case "workspace_search":
            result = await server.workspaceSearch(args.query, args.filePattern);
            break;
          case "read_file_outline":
            result = await server.readFileOutline(args.filePath);
            break;
          case "read_file_chunk":
            result = await server.readFileChunk(args.filePath, args.startLine, args.endLine);
            break;
          case "propose_hunk_edits":
            result = await server.proposeHunkEdits(args.filePath, args.hunks);
            break;
          case "run_terminal_command":
            result = await server.runTerminalCommand(args.command);
            break;
          default:
            result = { content: `Unknown tool: ${name}`, isError: true };
        }
        const response = {
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: result.content }],
            isError: result.isError
          }
        };
        process.stdout.write(JSON.stringify(response) + "\n");
      }
    } catch (err) {
      console.error("[MCP Error]", err);
    }
  }
});
//# sourceMappingURL=mcp-server.js.map
