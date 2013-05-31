// Insert
SuggestionStore.getStorage("ft", 2, function(e, o) {
    o.insertDocument({
        "id": 123,
        "type": "A",
        "text": "A andorinha voou."
    }, function() {
        o.insertDocument({
            "id": 124,
            "type": "A",
            "text": "Uma andorinha voou."
        }, function() {
            console.log("inserido");
        });
    });
});

// Search
SuggestionStore.getStorage("ft", 2, function(e, o) {
    o.search("a and", function(err, res) {
        console.log(res);
    });
});

SuggestionStore.getStorage("ft", 2, function(e, o) {
    o.updateDocument({
        "id": 123,
        "type": "A",
        "text": "Duas andorinha voaram."
    }, function() {
    });
});

// Delete
SuggestionStore.getStorage("ft", 2, function(e, o) {
    o.deleteDocument("A:123", function() {});
});
