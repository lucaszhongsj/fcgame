(function(root, factory) {
    if (typeof module === "object" && module.exports) {
        module.exports = factory();
        return;
    }
    root.JSNES = root.JSNES || {};
    root.JSNES.romLoadHelpers = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function() {
    function getRomRequestUrl(selectedUrl) {
        return selectedUrl;
    }

    function shouldStartRomFromAjaxResult(textStatus, status, data) {
        return textStatus === "success" && status >= 200 && status < 300 && !!data;
    }

    function getRomLoadErrorMessage(options) {
        var protocol = options && options.protocol ? options.protocol : "";
        var url = options && options.url ? options.url : "";
        var status = options && typeof options.status === "number" ? options.status : 0;
        var textStatus = options && options.textStatus ? options.textStatus : "error";

        if (protocol === "file:") {
            return "ROM 加载失败：当前使用 file:// 协议，请使用本地 HTTP 服务启动页面后再重试。";
        }

        return "ROM 加载失败（" + status + " / " + textStatus + "）：" + url;
    }

    return {
        getRomRequestUrl: getRomRequestUrl,
        shouldStartRomFromAjaxResult: shouldStartRomFromAjaxResult,
        getRomLoadErrorMessage: getRomLoadErrorMessage
    };
}));
