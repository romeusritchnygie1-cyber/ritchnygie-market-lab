import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// === Locale safety patch ===
// Some browser/container environments report `en-US@posix` as the system locale,
// which throws RangeError in Date.prototype.toLocaleString and Intl APIs used by
// libraries like lightweight-charts. Coerce any invalid locale to 'en-US'.
const _isBadLocale = (l) => !l || l === "en-US@posix" || (typeof l === "string" && l.includes("@"));
const _origDateToLocaleString = Date.prototype.toLocaleString;
const _origDateToLocaleDateString = Date.prototype.toLocaleDateString;
const _origDateToLocaleTimeString = Date.prototype.toLocaleTimeString;
const _origNumberToLocaleString = Number.prototype.toLocaleString;
Date.prototype.toLocaleString = function (locale, options) {
    return _origDateToLocaleString.call(this, _isBadLocale(locale) ? "en-US" : locale, options);
};
Date.prototype.toLocaleDateString = function (locale, options) {
    return _origDateToLocaleDateString.call(this, _isBadLocale(locale) ? "en-US" : locale, options);
};
Date.prototype.toLocaleTimeString = function (locale, options) {
    return _origDateToLocaleTimeString.call(this, _isBadLocale(locale) ? "en-US" : locale, options);
};
Number.prototype.toLocaleString = function (locale, options) {
    return _origNumberToLocaleString.call(this, _isBadLocale(locale) ? "en-US" : locale, options);
};
const _OrigDTF = Intl.DateTimeFormat;
Intl.DateTimeFormat = function (locale, options) {
    return new _OrigDTF(_isBadLocale(locale) ? "en-US" : locale, options);
};
Intl.DateTimeFormat.prototype = _OrigDTF.prototype;
const _OrigNF = Intl.NumberFormat;
Intl.NumberFormat = function (locale, options) {
    return new _OrigNF(_isBadLocale(locale) ? "en-US" : locale, options);
};
Intl.NumberFormat.prototype = _OrigNF.prototype;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
