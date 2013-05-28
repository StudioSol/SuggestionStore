(function(exports) {

    function getDocumentKey(document) {
        return document.type + ":" + document.id;
    }
    exports.getDocumentKey = getDocumentKey;

    function getDocumentSet(docRefs) {
        var count = {}, i = 0, x, xs = [];

        for (; i < docRefs.length; i += 1) {
            count[docRefs[i]] = (count[docRefs[i]] || 0) + 1;
        }

        for (x in count) {
            if (count.hasOwnProperty(x)) {
                xs.push(x);
            }
        }

        xs.sort(function(a, b) {
            return count[a] > count[b] ? -1 : 1;
        });

        return xs;
    }
    exports.getDocumentSet = getDocumentSet;

}(window.FT = window.FT || {}));
