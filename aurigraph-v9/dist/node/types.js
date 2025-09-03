"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeStatus = exports.NodeType = void 0;
var NodeType;
(function (NodeType) {
    NodeType["VALIDATOR"] = "validator";
    NodeType["BASIC"] = "basic";
    NodeType["ASM"] = "asm";
})(NodeType || (exports.NodeType = NodeType = {}));
var NodeStatus;
(function (NodeStatus) {
    NodeStatus["INITIALIZING"] = "initializing";
    NodeStatus["RUNNING"] = "running";
    NodeStatus["SYNCING"] = "syncing";
    NodeStatus["STOPPING"] = "stopping";
    NodeStatus["STOPPED"] = "stopped";
    NodeStatus["ERROR"] = "error";
})(NodeStatus || (exports.NodeStatus = NodeStatus = {}));
//# sourceMappingURL=types.js.map