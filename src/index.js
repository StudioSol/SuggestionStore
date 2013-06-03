(function(exports) {

    function getDocumentKey(document) {
        return document.type + ":" + document.id;
    }
    exports.getDocumentKey = getDocumentKey;

    /**
     * Returns unique elements of an Array ordered by the numbers of times they
     * appear.
     *
     * @param {array} docRefs - The original array.
     */
    function getDocumentSet(docRefs) {
        var count = {}, i = 0, x, xs = [];

        for (; i < docRefs.length; i += 1) {
            x = docRefs[i];

            if (x in count) {
                count[x] += 1;
            } else {
                count[x] = 1;
                xs.push(x);
            }
        }

        xs.sort(function(a, b) {
            return count[a] > count[b] ? -1 : 1;
        });

        return xs;
    }
    exports.getDocumentSet = getDocumentSet;

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
