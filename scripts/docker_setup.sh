docker build game -t gcr.io/tsbr-1/game:v0
docker build game_instance_manager -t gcr.io/tsbr-1/game-instance-manager:v0
docker build game_server -t gcr.io/tsbr-1/game-server:v0
docker build matchmaker -t gcr.io/tsbr-1/matchmaker:v0
docker build game_instance_manager_sidecar -t gcr.io/tsbr-1/game-instance-manager-sidecar:v0

docker push gcr.io/tsbr-1/game:v0
docker push gcr.io/tsbr-1/game-instance-manager:v0
docker push gcr.io/tsbr-1/game-server:v0
docker push gcr.io/tsbr-1/matchmaker:v0
docker push gcr.io/tsbr-1/game-instance-manager-sidecar:v0
