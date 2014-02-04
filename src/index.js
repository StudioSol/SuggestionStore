(function(exports) {

    function getDocumentKey(document) {
        return document.type + ":" + document.id;
    }
    exports.getDocumentKey = getDocumentKey;

    function groupBy(items, keyFn) {
        var result = {}, i = 0, v, k;

        for (; i < items.length; i += 1) {
            v = items[i];
            k = keyFn(v);

            if (k in result) {
                result[k].push(v);
            } else {
                result[k] = [v];
            }
        }

        return result;
    }
    exports.groupBy = groupBy;

}(window.SuggestionStore = window.SuggestionStore || {}));
