(function(exports) {
    // Polyfill
    exports.map = function(xs, fn) {
        var xs_l = xs.length, i = 0, results = [];
        for (; i < xs_l; i += 1) {
            results.push(fn(xs[i]));
        }
        return results;
    };

    function getObjectValues(obj) {
        var prop, val, values = [];

        for (prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                val = obj[prop];
                values.push(val);
            }
        }

        return values;
    }
    exports.getObjectValues = getObjectValues;

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

    function getIntersection() {
        var args = Array.prototype.slice.call(arguments),
            args_l = args.length, counting = {}, set, str, i = 0, j = 0, 
            results = [];

        for (; i < args_l; i += 1) {
            set = args[i];
            for (j = 0; j < set.length; j += 1) {
                str = set[j];

                if (!counting[str]) {
                    counting[str] = 1;
                } else {
                    counting[str] += 1;
                }
            }
        }

        for (str in counting) {
            if (counting[str] === args_l) {
                results.push(str);
            }
        }

        return results;
    }
    exports.getIntersection = getIntersection;

}(window.SuggestionStore = window.SuggestionStore || {}));
