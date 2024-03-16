build:
	set -e 
	python3 build.py frontend/lobby.js
	python3 build.py frontend/login.js login
	python3 build.py frontend/create.js create
	python3 build.py frontend/game.js game
	python3 build.py frontend/spectator.js spectate
	python3 build.py frontend/howto.js howto
	make local_bots

local_bots:
	python3 build.py frontend/target_dummy.js target_dummy
	python3 build.py frontend/angry_chicken.js angry_chicken
	python3 build.py frontend/mad_scientist.js mad_scientist

.PHONY: build local_bots
