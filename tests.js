QUnit.module("Replace");

test("char in a string based on a map.", function () {
    var replace = new FT.Replace();

    replace.setMap({
        "á": "a"
    });

    equal(replace.apply("á"), "a");
});

test("multiple chars in a string based on a map.", function () {
    var replace = new FT.Replace();

    replace.setMap({
        "á": "a",
        "ó": "o",
        "ê": "e"
    });

    equal(replace.apply("á foo ó êêê"), "a foo o eee");
});

test("unicode chars", function () {
    equal(FT.unicodeReplace.apply("ä áãê"), "a aae");
    equal(FT.unicodeReplace.apply("ivan júnior"), "ivan junior");
});


QUnit.module("Split");

test("words by space", function() {
    var split = new FT.Split();
    deepEqual(split.apply("foo bar baz"), ["foo", "bar", "baz"]);
});

test("words and numbers by space", function() {
    var split = new FT.Split();
    deepEqual(split.apply("foo palcomp3"), ["foo", "palcomp3"]);
});

test("words by non-text chars", function() {
    var split = new FT.Split();
    deepEqual(split.apply("foo!!!bar-baz"), ["foo", "bar", "baz"]);
});

test("without empty tokens", function() {
    var split = new FT.Split();
    deepEqual(split.apply("foo!"), ["foo"]);
});

QUnit.module("Pipeline");

test("calls every step", function() {
    var calls = 0, fakeStep, pipe;

    fakeStep = {
        apply: function(input) {
            calls += 1;
        }
    };

    pipe = new FT.Pipeline([
        fakeStep,
        fakeStep,
        fakeStep
    ]);

    pipe.apply();

    equal(calls, 3);
});

test("with the output of the prev", function() {
    var calls = 0, fakeStep, pipe;

    fakeStep = {
        apply: function(input) {
            return input + 1;
        }
    };

    pipe = new FT.Pipeline([
        fakeStep,
        fakeStep,
        fakeStep
    ]);

    equal(pipe.apply(0), 3);
});

QUnit.module("Ngram");

test("makes all combs", function() {
    deepEqual(FT.createNgrams("ivan"), ["i", "iv", "iva", "ivan"]);
});

test("respects min len", function() {
    deepEqual(FT.createNgrams("ivan", 2), ["iv", "iva", "ivan"]);
    deepEqual(FT.createNgrams("ivan", 3), ["iva", "ivan"]);
});

test("respects max len", function() {
    deepEqual(FT.createNgrams("ivan", 1, 1), ["i"]);
    deepEqual(FT.createNgrams("ivan", 1, 2), ["i", "iv"]);
});

test("understands its size", function() {
    deepEqual(FT.createNgrams("ivan", 1, 7), ["i", "iv", "iva", "ivan"]);
});

test("respects min and max together", function() {
    deepEqual(FT.createNgrams("ivan", 2, 3), ["iv", "iva"]);
});

QUnit.module("TokenSet");

test("keeps order", function() {
    equal(FT.getTokenSet(["a", "a", "ab", "a"])[0], "a");
    equal(FT.getTokenSet(["b", "a", "a", "ab", "a"])[0], "b");
});

test("doesn't contain an element twice", function() {
    deepEqual(FT.getTokenSet(["a", "a", "ab", "a"]), ["a", "ab"]);
});

QUnit.module("Tokenization");

test("works as expected", function() {
    deepEqual(
        FT.tokenize("A andorinha vôou"),
        ["a", "andorinha", "voou", "a ", "a a", "a an", "a and", "a ando",
         "a andor", "a andori", "a andorin", "a andorinh", "a andorinha",
         "a andorinha ", "a andorinha v", "a andorinha vo", "a andorinha voo",
         "a andorinha voou", "an", "and", "ando", "andor", "andori", "andorin",
         "andorinh", "v", "vo", "voo"]
    );
});


QUnit.module("Document");

test("different types should have different keys even if their ids are equal", function() {
    var dta, dtm;

    dta = {
        "id": 123213,
        "type": "A"
    };

    dtm = {
        "id": 123213,
        "type": "M"
    };

    notEqual(
        FT.getDocumentKey(dta),
        FT.getDocumentKey(dtm)
    );
});

QUnit.module("DocumentSet");

test("elements are ordered by they quantity", function() {
    equal(FT.getDocumentSet(["ab", "a", "a", "a"])[0], "a");
});

test("doesn't contain an element twice", function() {
    deepEqual(FT.getDocumentSet(["b", "a", "a", "b", "a"]), ["a", "b"]);
});

QUnit.module("Lock");

test("respects incr and decr", function() {
    var called = false, counter = new FT.Lock();

    counter.setCallback(function() {
        called = true;
    });

    counter.incr();
    counter.incr();

    counter.decr();
    ok(!called);

    counter.decr();
    ok(!called);

    counter.decr();
    ok(called);
});
