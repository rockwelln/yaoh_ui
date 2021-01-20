demo:
	scp -r build/* root@10.0.23.4:/opt/www

pot:
	#ls src/**/*.js~src/utils/common* | xargs node_modules/.bin/babel
	ls src/**/*.js | xargs node_modules/.bin/babel
	node_modules/.bin/rip json2pot '_translations/src/**/*.json' -o ./apio_async_ui.pot

po2json:
	node_modules/.bin/rip po2json '_translations/*.po' -m '_translations/src/**/*.json' -o ./src/translations

map:
	source-map-explorer build/static/js/main.*.js build/static/js/main.*.js.map