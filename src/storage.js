(function(exports) {
     var indexedDB = window.indexedDB || window.mozIndexedDB ||
                     window.webkitIndexedDB || window.msIndexedDB,
         IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange ||
                       window.msIDBKeyRange;

    function Lock() {
        this.counter = 1;
        this.callback = null;
    }
    exports.Lock = Lock;

    /**
     * @private
     */
    Lock.prototype.check = function() {
        if (this.callback && this.counter === 0) {
            this.callback();
            this.callback = null;
        }
    };

    Lock.prototype.setCallback = function(callback) {
        this.callback = callback;
        this.check();
    };

    Lock.prototype.incr = function() {
        this.counter += 1;
    };

    Lock.prototype.decr = function() {
        if (this.counter > 0) {
            this.counter -= 1;
        }

        this.check();
    };

    function Storage(idb) {
        this.idb = idb;
    }

    /**
     * @private
     */
    Storage.prototype.createDocTokens = function(trans, document, callback) {
        var lock, tokenRefs = [], tokenStore, i,
            tokens = SuggestionStore.tokenize(document.text);

        lock = new Lock();

        function onRefAdded(e) {
            tokenRefs.push(e.target.result);
            lock.decr();
        }

        tokenStore = trans.objectStore("references");

        for (i = 0; i < tokens.length; i += 1) {
            lock.incr();
            tokenStore.add({
                token: tokens[i],
                documentKey: document._key
            }).onsuccess = onRefAdded;
        }

        lock.setCallback(function() {
            callback(tokenRefs);
        });
        lock.decr();
    };

    /**
     * @private
     */
    Storage.prototype.removeDocTokens = function(trans, lock, tokenRefs) {
        var decrLock, tokenStore, i;

        decrLock = function() {
            lock.decr();
        };

        tokenStore = trans.objectStore("references");

        for (i = 0; i < tokenRefs.length; i += 1) {
            lock.incr();
            tokenStore["delete"](tokenRefs[i]).onsuccess = decrLock;
        }
    };

    Storage.prototype.insertDocument = function(document, callback) {
        var key, trans, lock;

        key = SuggestionStore.getDocumentKey(document);
        document._key = key;
        trans = this.idb.transaction(["documents", "references"], "readwrite");

        lock = new Lock();

        lock.incr();
        this.createDocTokens(trans, document, function(tokenRefs) {
            document._tokenRefs = tokenRefs;

            lock.incr();
            trans.objectStore("documents").add(document)
             .onsuccess = function() {
                lock.decr();
            };

            lock.decr();
        });

        lock.setCallback(function() {
            callback(null);
        });

        lock.decr();
    };

    Storage.prototype.updateDocument =
     function(type, id, getDocumentFn, callback) {
        var that = this, trans, key, lock, docStore, putDoc;

        trans = this.idb.transaction(["documents", "references"], "readwrite");

        lock = new Lock();

        key = SuggestionStore.getDocumentKey({
            type: type,
            id: id
        });

        docStore = trans.objectStore("documents");

        putDoc = function(document) {
            lock.incr();
            docStore.put(document).onsuccess =  function() {
                lock.decr();
            };
        };

        lock.incr();
        docStore.get(key).onsuccess = function(e) {
            var storedDocument, document;

            storedDocument = e.target.result;

            document = getDocumentFn(storedDocument);
            document._key = key;

            if (!storedDocument || storedDocument !== document.text) {
                if (storedDocument) {
                    that.removeDocTokens(trans, lock, storedDocument._tokenRefs.slice());
                }
                document._tokenRefs = [];
                lock.incr();
                that.createDocTokens(trans, document, function(tokenRefs) {
                    document._tokenRefs = tokenRefs;
                    putDoc(document);
                    lock.decr();
                });
            } else {
                putDoc(document);
            }

            lock.decr();
        };

        lock.setCallback(function() {
            callback(null);
        });

        lock.decr();
    };

    Storage.prototype.deleteDocument = function(key, callback) {
        var that = this, trans, lock, docStore;

        trans = this.idb.transaction(["documents", "references"], "readwrite");
        lock = new Lock();

        docStore = trans.objectStore("documents");

        lock.incr();
        docStore.get(key).onsuccess = function(e) {
            var document = e.target.result;
            that.removeDocTokens(trans, lock, document._tokenRefs.slice());

            lock.incr();
            docStore["delete"](key).onsuccess = function() {
                lock.decr();
            };

            lock.decr();
        };

        lock.setCallback(function() {
            callback(null);
        });

        lock.decr();
    };

    Storage.prototype.getDocument = function(type, id, callback) {
        var key, req;

        key = SuggestionStore.getDocumentKey({
            type: type,
            id: id
        });

        req = this.idb.transaction(["documents"]).objectStore("documents").get(key);

        req.onsuccess = function(e) {
            var document = e.target.result;

            if (document) {
                // internal
                delete document._key;
                delete document._tokenRefs;
            }

            callback(null, document);
        };

        req.onerror = function(e) {
            callback(e.target.errorCode, null);
        };
    };

    Storage.prototype.getDocs = function(keys, callback) {
        var lock, lookupCb, docStore, i, docs = [];

        lock = new Lock();
        docStore = this.idb.transaction(["documents"])
                    .objectStore("documents");

        lookupCb = function(e) {
            var doc = e.target.result;

            if (doc) {
                // internal
                delete doc._key;
                delete doc._tokenRefs;

                docs.push(doc);
            }
            lock.decr();
        };

        for (i = 0; i < keys.length; i += 1) {
            lock.incr();
            docStore.get(keys[i]).onsuccess = lookupCb;
        }

        lock.setCallback(function() {
            callback(docs);
        });

        lock.decr();
    };

    Storage.prototype.search = function(query, callback) {
        var that = this, tokens, i, lock, tokenIndex, cursor,
            docKeysByToken = {};

        tokens = SuggestionStore.cleanQuery(query);
        lock = new SuggestionStore.Lock();
        tokenIndex = this.idb.transaction(["references"])
                     .objectStore("references").index("token");

        for (i = 0; i < tokens.length; i += 1) {
            docKeysByToken[tokens[i]] = [];
        }

        function createLookupCb(token) {
            return function(e) {
                var cursor = e.target.result;
                if (cursor) {
                    docKeysByToken[token].push(cursor.value.documentKey);

                    cursor["continue"]();
                } else {
                    lock.decr();
                }
            };
        }

        for (i = 0; i < tokens.length; i += 1) {
            lock.incr();

            tokenIndex.openCursor(
                IDBKeyRange.only(tokens[i])
            ).onsuccess = createLookupCb(tokens[i]);
        }

        lock.setCallback(function() {
            var keys = SuggestionStore.getObjectValues(docKeysByToken),
                mapFn = SuggestionStore.getDocumentSet,
                keySets = SuggestionStore.map(keys, mapFn),
                intersection = SuggestionStore.getIntersection(keySets);

            that.getDocs(intersection, function(docs) {
                callback(null, docs);
            });
        });

        lock.decr();
    };

    function DatabaseManager(name, version) {
        /* @protected */
        this.name = name;
        this.version = version;
    }
    exports.DatabaseManager = DatabaseManager;

    DatabaseManager.prototype.get = function(callback) {
        var that = this, req = indexedDB.open(this.name, this.version);

        req.onsuccess = function() {
            callback(null, this.result);
        };

        req.onerror = function(e) {
            callback(e.target.errorCode, null);
        };

        req.onupgradeneeded = function(e) {
            that.handleUpgradeNeeded(e);
        };
    };

    /* @protected */
    DatabaseManager.prototype.initialSetup = function(db) {
        var refStore;
        db.createObjectStore("documents", {keyPath: "_key"});
        refStore = db.createObjectStore("references", {autoIncrement: true});
        refStore.createIndex("token", "token");
    };

    DatabaseManager.prototype.handleUpgradeNeeded = function(e) {
        this.initialSetup(e.currentTarget.result);
    };

    function getStorage(manager, callback) {
        manager.get(function(err, db) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, new Storage(db));
            }
        });
    }
    exports.getStorage = getStorage;

}(window.SuggestionStore = window.SuggestionStore || {}));
