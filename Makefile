NODEJS := env nodejs
NPM := env npm

all: install run

install:
	$(NPM) install

run:
	$(NODEJS) index.js

clean:
	-rm -rv ./node_modules