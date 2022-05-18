"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
const sdk_1 = require("@hashgraph/sdk");
exports.client = sdk_1.Client.forMainnet().setOperator((_a = process.env.OPERATOR_ID) !== null && _a !== void 0 ? _a : '', (_b = process.env.OPERATOR_PVKEY) !== null && _b !== void 0 ? _b : '');
