;(function(root) {
    function buildRomsConfig(indexData, manifests) {
        var result = {};
        var validSources = (indexData && indexData.sources) || [];
        var manifestMap = {};
        var i;

        for (i = 0; i < manifests.length; i++) {
            if (manifests[i] && manifests[i].source_repo) {
                manifestMap[manifests[i].source_repo] = manifests[i];
            }
        }

        for (i = 0; i < validSources.length; i++) {
            var source = validSources[i];
            var manifest = manifestMap[source.source_repo];
            if (!manifest || !Array.isArray(manifest.roms) || manifest.roms.length === 0) {
                continue;
            }

            var groupName = manifest.display_name || source.display_name || source.source_repo;
            var groupItems = [];
            for (var j = 0; j < manifest.roms.length; j++) {
                var rom = manifest.roms[j];
                if (!rom || !rom.path) {
                    continue;
                }
                groupItems.push([rom.name || rom.slug || rom.path, rom.path]);
            }

            if (groupItems.length > 0) {
                result[groupName] = groupItems;
            }
        }

        return result;
    }

    function loadCatalog(indexUrl, callbacks) {
        var options = callbacks || {};
        if (!root.$ || !root.$.ajax) {
            if (options.onError) {
                options.onError(new Error('jQuery.ajax is unavailable'));
            }
            return;
        }

        function requestJson(url, onSuccess, onError) {
            root.$.ajax({
                url: url,
                dataType: 'json',
                cache: false,
                success: onSuccess,
                error: function(xhr, textStatus, errorThrown) {
                    if (onError) {
                        onError(new Error(errorThrown || textStatus || ('failed to load: ' + url)));
                    }
                }
            });
        }

        requestJson(indexUrl, function(indexData) {
            var sources = (indexData && indexData.sources) || [];
            if (sources.length === 0) {
                if (options.onSuccess) {
                    options.onSuccess({});
                }
                return;
            }

            var manifests = [];
            var pending = sources.length;
            var failed = false;

            function done() {
                pending -= 1;
                if (pending === 0 && !failed && options.onSuccess) {
                    options.onSuccess(buildRomsConfig(indexData, manifests));
                }
            }

            for (var i = 0; i < sources.length; i++) {
                (function(source) {
                    requestJson(source.manifest, function(manifestData) {
                        manifests.push(manifestData);
                        done();
                    }, function(err) {
                        if (failed) {
                            return;
                        }
                        failed = true;
                        if (options.onError) {
                            options.onError(err);
                        }
                    });
                }(sources[i]));
            }
        }, function(err) {
            if (options.onError) {
                options.onError(err);
            }
        });
    }

    root.FCGameRomCatalog = {
        buildRomsConfig: buildRomsConfig,
        loadCatalog: loadCatalog
    };
}(window));
