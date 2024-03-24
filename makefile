JS_FILES := $(wildcard js/*.js) $(wildcard js/*/*.js) $(wildcard js/*/*/*.js)


all: js


.PHONY: js
js:
	tsc

watch:
	tsc -w

server:
	python3 -m http.server


linecount:
	find . -name '*.ts' | xargs wc -l
	

pack:
	mkdir -p temp
	cp -r assets temp/assets
	cp -r js temp/js
	cp index.html temp/index.html
	cp style.css temp/style.css
	(cd temp; zip -r ../dist.zip .)
	rm -rf ./temp

dist: js pack


.PHONY: closure
closure:
	rm -rf ./temp
	mkdir -p temp
	java -jar $(CLOSURE_PATH) --js $(JS_FILES) --js_output_file temp/out.js --compilation_level ADVANCED_OPTIMIZATIONS --language_out ECMASCRIPT_2020
