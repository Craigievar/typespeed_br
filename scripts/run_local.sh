trap "killall -9 node" EXIT
npm run start-local --prefix matchmaker/ & npm run start-local --prefix game_instance_manager/ & npm run start-local --prefix game_server/ & npm run start --prefix game/
