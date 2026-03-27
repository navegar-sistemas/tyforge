"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ApiTester;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var styles_module_css_1 = __importDefault(require("./styles.module.css"));
function ApiTester(_a) {
    var _this = this;
    var _b = _a.method, method = _b === void 0 ? 'GET' : _b, endpoint = _a.endpoint, _c = _a.headers, headers = _c === void 0 ? {} : _c, _d = _a.body, body = _d === void 0 ? null : _d, description = _a.description, _e = _a.responses, responses = _e === void 0 ? [] : _e;
    var _f = (0, react_1.useState)(''), response = _f[0], setResponse = _f[1];
    var _g = (0, react_1.useState)({}), responseHeaders = _g[0], setResponseHeaders = _g[1];
    var _h = (0, react_1.useState)(''), rawResponse = _h[0], setRawResponse = _h[1];
    var _j = (0, react_1.useState)(0), statusCode = _j[0], setStatusCode = _j[1];
    var _k = (0, react_1.useState)(false), loading = _k[0], setLoading = _k[1];
    var _l = (0, react_1.useState)(''), error = _l[0], setError = _l[1];
    var _m = (0, react_1.useState)(JSON.stringify(headers, null, 2)), customHeaders = _m[0], setCustomHeaders = _m[1];
    var _o = (0, react_1.useState)(JSON.stringify(body, null, 2)), customBody = _o[0], setCustomBody = _o[1];
    var _p = (0, react_1.useState)(endpoint), customEndpoint = _p[0], setCustomEndpoint = _p[1];
    var _q = (0, react_1.useState)('body'), activeTab = _q[0], setActiveTab = _q[1];
    var _r = (0, react_1.useState)(0), activeScenario = _r[0], setActiveScenario = _r[1];
    var _s = (0, react_1.useState)(false), showMockResponse = _s[0], setShowMockResponse = _s[1];
    var executeRequest = function () { return __awaiter(_this, void 0, void 0, function () {
        var parsedHeaders, options, res, contentType, headersObj_1, text, data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError('');
                    setResponse('');
                    setResponseHeaders({});
                    setRawResponse('');
                    setStatusCode(0);
                    setShowMockResponse(false);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    parsedHeaders = JSON.parse(customHeaders);
                    options = {
                        method: method,
                        headers: __assign({ 'Content-Type': 'application/json' }, parsedHeaders),
                    };
                    if (method !== 'GET' && customBody) {
                        options.body = customBody;
                    }
                    return [4 /*yield*/, fetch(customEndpoint, options)];
                case 2:
                    res = _a.sent();
                    contentType = res.headers.get('content-type');
                    // Capture status code
                    setStatusCode(res.status);
                    headersObj_1 = {};
                    res.headers.forEach(function (value, key) {
                        headersObj_1[key] = value;
                    });
                    setResponseHeaders(headersObj_1);
                    return [4 /*yield*/, res.text()];
                case 3:
                    text = _a.sent();
                    setRawResponse(text);
                    data = void 0;
                    try {
                        if (contentType && contentType.includes('application/json')) {
                            data = JSON.parse(text);
                            setResponse(JSON.stringify(data, null, 2));
                        }
                        else {
                            setResponse(text);
                        }
                    }
                    catch (_b) {
                        setResponse(text);
                    }
                    return [3 /*break*/, 6];
                case 4:
                    err_1 = _a.sent();
                    setError(err_1.message || 'Erro ao executar requisição');
                    return [3 /*break*/, 6];
                case 5:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var showScenario = function (index) {
        setActiveScenario(index);
        setShowMockResponse(true);
        setError(''); // Clear any previous errors
        var scenario = responses[index];
        setStatusCode(scenario.status);
        setResponse(JSON.stringify(scenario.body, null, 2));
        setResponseHeaders(scenario.headers || {});
        setRawResponse(JSON.stringify(scenario.body));
    };
    var renderTabContent = function () {
        if (error && !showMockResponse) {
            return (0, jsx_runtime_1.jsx)("div", { className: styles_module_css_1.default.error, children: error });
        }
        switch (activeTab) {
            case 'body':
                return (0, jsx_runtime_1.jsx)("pre", { className: styles_module_css_1.default.response, children: response });
            case 'headers':
                return ((0, jsx_runtime_1.jsx)("pre", { className: styles_module_css_1.default.response, children: JSON.stringify(responseHeaders, null, 2) }));
            case 'raw':
                return (0, jsx_runtime_1.jsx)("pre", { className: styles_module_css_1.default.response, children: rawResponse });
            case 'preview':
                if (rawResponse.includes('<html') ||
                    rawResponse.includes('<!DOCTYPE')) {
                    return ((0, jsx_runtime_1.jsx)("iframe", { className: styles_module_css_1.default.preview, srcDoc: rawResponse, title: "Preview" }));
                }
                return (0, jsx_runtime_1.jsx)("pre", { className: styles_module_css_1.default.response, children: response });
            default:
                return null;
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: styles_module_css_1.default.apiTester, children: [description && (0, jsx_runtime_1.jsx)("p", { className: styles_module_css_1.default.description, children: description }), responses.length > 0 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: styles_module_css_1.default.scenarioHeader, children: (0, jsx_runtime_1.jsx)("h3", { className: styles_module_css_1.default.scenarioTitle, children: "Exemplos de Resposta" }) }), (0, jsx_runtime_1.jsx)("div", { className: styles_module_css_1.default.scenarioTabs, children: responses.map(function (scenario, index) { return ((0, jsx_runtime_1.jsx)("button", { className: "".concat(styles_module_css_1.default.scenarioTab, " ").concat(activeScenario === index && showMockResponse ? styles_module_css_1.default.active : ''), onClick: function () { return showScenario(index); }, children: (0, jsx_runtime_1.jsx)("span", { className: "".concat(styles_module_css_1.default.scenarioStatus, " ").concat(scenario.status >= 200 && scenario.status < 300 ? styles_module_css_1.default.success : scenario.status >= 400 ? styles_module_css_1.default.error : styles_module_css_1.default.warning), children: scenario.status }) }, index)); }) }), showMockResponse && ((0, jsx_runtime_1.jsx)("div", { className: styles_module_css_1.default.scenarioDescriptionBar, children: (0, jsx_runtime_1.jsx)("span", { className: styles_module_css_1.default.activeDescription, children: responses[activeScenario].description }) }))] })), (0, jsx_runtime_1.jsxs)("div", { className: styles_module_css_1.default.requestSection, children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_module_css_1.default.methodEndpoint, children: [(0, jsx_runtime_1.jsx)("span", { className: "".concat(styles_module_css_1.default.method, " ").concat(styles_module_css_1.default[method.toLowerCase()]), children: method }), (0, jsx_runtime_1.jsx)("input", { type: "text", className: styles_module_css_1.default.endpointInput, value: customEndpoint, onChange: function (e) { return setCustomEndpoint(e.target.value); }, placeholder: "Endpoint URL" }), (0, jsx_runtime_1.jsx)("button", { className: styles_module_css_1.default.executeButton, onClick: executeRequest, disabled: loading, children: loading ? 'Executando...' : 'Executar' })] }), (0, jsx_runtime_1.jsxs)("div", { className: styles_module_css_1.default.headers, children: [(0, jsx_runtime_1.jsx)("h4", { children: "Headers" }), (0, jsx_runtime_1.jsx)("textarea", { className: styles_module_css_1.default.codeEditor, value: customHeaders, onChange: function (e) { return setCustomHeaders(e.target.value); }, rows: 5, placeholder: '{"Authorization": "Bearer token"}' })] }), method !== 'GET' && ((0, jsx_runtime_1.jsxs)("div", { className: styles_module_css_1.default.body, children: [(0, jsx_runtime_1.jsx)("h4", { children: "Request Body" }), (0, jsx_runtime_1.jsx)("textarea", { className: styles_module_css_1.default.codeEditor, value: customBody, onChange: function (e) { return setCustomBody(e.target.value); }, rows: 10, placeholder: '{"key": "value"}' })] }))] }), (response || error || showMockResponse) && ((0, jsx_runtime_1.jsxs)("div", { className: styles_module_css_1.default.responseSection, children: [(0, jsx_runtime_1.jsxs)("div", { className: styles_module_css_1.default.responseHeader, children: [(0, jsx_runtime_1.jsx)("h4", { children: "Resposta" }), statusCode > 0 && ((0, jsx_runtime_1.jsx)("span", { className: "".concat(styles_module_css_1.default.statusCode, " ").concat(statusCode >= 200 && statusCode < 300 ? styles_module_css_1.default.success : statusCode >= 400 ? styles_module_css_1.default.error : styles_module_css_1.default.warning), children: statusCode }))] }), !error && ((0, jsx_runtime_1.jsxs)("div", { className: styles_module_css_1.default.tabs, children: [(0, jsx_runtime_1.jsx)("button", { className: "".concat(styles_module_css_1.default.tab, " ").concat(activeTab === 'body' ? styles_module_css_1.default.active : ''), onClick: function () { return setActiveTab('body'); }, children: "Body" }), (0, jsx_runtime_1.jsx)("button", { className: "".concat(styles_module_css_1.default.tab, " ").concat(activeTab === 'headers' ? styles_module_css_1.default.active : ''), onClick: function () { return setActiveTab('headers'); }, children: "Headers" }), (0, jsx_runtime_1.jsx)("button", { className: "".concat(styles_module_css_1.default.tab, " ").concat(activeTab === 'raw' ? styles_module_css_1.default.active : ''), onClick: function () { return setActiveTab('raw'); }, children: "Raw" }), (0, jsx_runtime_1.jsx)("button", { className: "".concat(styles_module_css_1.default.tab, " ").concat(activeTab === 'preview' ? styles_module_css_1.default.active : ''), onClick: function () { return setActiveTab('preview'); }, children: "Preview" })] })), (0, jsx_runtime_1.jsx)("div", { className: styles_module_css_1.default.tabContent, children: renderTabContent() })] }))] }));
}
