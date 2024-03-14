build:
	python3 build.py frontend/lobby.js
	python3 build.py frontend/login.js login
	python3 build.py frontend/create.js create

.PHONY: build
