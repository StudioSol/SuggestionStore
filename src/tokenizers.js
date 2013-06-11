(function(exports) {

    function Trim() {}
    Trim.prototype.wsRE = /\s/;
    Trim.prototype.replaceRE = /^\s\s*/;
    Trim.prototype.apply = function(input) {
        var str = input.replace(this.replaceRE, ''),
            ws = this.wsRE,
            i = str.length;
        while (ws.test(str.charAt(--i)));
        return str.slice(0, i + 1);
    };

    function Replace() {
        this.REs = {};
    }
    exports.Replace = Replace;

    Replace.prototype.setMap = function(map) {
        var key, val, tmp = {};

        this.REs = {};

        for (key in map) {
            if (map.hasOwnProperty(key)) {
                val = map[key];

                if (val in tmp) {
                    tmp[val].push(key);
                } else {
                    tmp[val] = [key];
                }
            }
        }

        for (key in tmp) {
            if (tmp.hasOwnProperty(key)) {
                val = tmp[key];
                this.REs[key] = new RegExp("(" + val.join("|") + ")", "gi");
            }
        }
    };

    Replace.prototype.apply = function(input) {
        var output, key, val;
        output = input;

        for (key in this.REs) {
            if (this.REs.hasOwnProperty(key)) {
                val = this.REs[key];
                output = output.replace(val, key);
            }
        }

        return output;
    };

    var unicodeReplace = new Replace();
    unicodeReplace.setMap({
        "á": "a",  "à": "a",  "â": "a",
        "ã": "a",  "ä": "a",  "é": "e",
        "è": "e",  "ê": "e",  "ë": "e",
        "í": "i",  "ì": "i",  "î": "i",
        "ó": "o",  "ò": "o",  "ô": "o",
        "õ": "o",  "ö": "o",  "ú": "u",
        "ù": "u",  "û": "u",  "ü": "u",
        "ç": "c",  "ñ": "n"
    });
    exports.unicodeReplace = unicodeReplace;

    function Split() {}
    exports.Split = Split;
    Split.prototype.RE = /[^\w\d]+/g;
    Split.prototype.apply = function(input) {
        o =  input.split(this.RE);

        if (o && o[o.length - 1] === "") {
            o.pop();
        }

        return o;
    };

    function Lower() {}
    exports.Lower = Lower;
    Lower.prototype.apply = function(input) {
        return ("" + input).toLowerCase();
    };

    function createNgrams(input, minLength, maxLength) {
        var output = [];

        minLength = minLength || 1;
        maxLength = Math.min(input.length, maxLength || Number.MAX_VALUE);

        do {
            input = input.slice(0, maxLength);
            output.push(input);
        } while(--maxLength >= minLength);

        return output.reverse();
    }
    exports.createNgrams = createNgrams;

    function addPhraseNgrams(input) {
        var output = [], ngrams = createNgrams(input.join(" "), 1, 30),
            i = 0, len = ngrams.length;

        for (; i < len; i += 1) {
            output.push(ngrams[i]);
        }

        return output;
    }
    exports.addPhraseNgrams = addPhraseNgrams;

   function addTokenNgrams(input) {
        var output = [], i = 0, len = input.length;

        for (; i < len; i += 1) {
            output.push.apply(output, createNgrams(input[i], 1, 20));
        }

        return output;
    }
    exports.addTokenNgrams = addTokenNgrams;

    function getTokenSet(tokens) {
        var swp = {}, i = 0, len = tokens.length, cur, result = [];

        for (; i < len; i += 1) {
            cur = tokens[i];
            if (!(cur in swp)) {
                swp[cur] = 1;
                result.push(cur);
            }
        }

        return result;
    }
    exports.getTokenSet = getTokenSet;


    function Pipeline(steps) {
        this.steps = steps;
    }
    exports.Pipeline = Pipeline;

    Pipeline.prototype.apply = function(input) {
        var i = 0, len, step, output = input;
        for (len = this.steps.length; i < len; i += 1) {
            step = this.steps[i];
            output = step.apply(output);
        }
        return output;
    };

    var defaultPipeline = new Pipeline([
        new Trim(),
        new Lower(),
        unicodeReplace,
        new Split()
    ]);

    function cleanQuery(input) {
        return defaultPipeline.apply(input);
    }
    exports.cleanQuery = cleanQuery;

    function tokenize(input) {
        var output;
        input = defaultPipeline.apply(input);
        output = input.slice();
        output.push.apply(output, addPhraseNgrams(input));
        output.push.apply(output, addTokenNgrams(input));
        return getTokenSet(output);
    }
    exports.tokenize = tokenize;

}(window.SuggestionStore = window.SuggestionStore || {}));
