build:
	python3 build.py frontend/lobby.js
	python3 build.py frontend/login.js login
	python3 build.py frontend/create.js create
	python3 build.py frontend/game.js game
	python3 build.py frontend/spectator.js spectate

.PHONY: build
