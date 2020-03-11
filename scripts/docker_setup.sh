docker build game -t gcr.io/tsbr-cluster-demo/game:v0
docker build game_instance_manager -t gcr.io/tsbr-cluster-demo/game-instance-manager:v0
docker build game_server -t gcr.io/tsbr-cluster-demo/game-server:v0
docker build matchmaker -t gcr.io/tsbr-cluster-demo/matchmaker:v0
docker build api -t gcr.io/tsbr-cluster-demo/api:v0
docker build autoscaler -t gcr.io/tsbr-cluster-demo/autoscaler:v0

docker push gcr.io/tsbr-cluster-demo/game:v0
docker push gcr.io/tsbr-cluster-demo/game-instance-manager:v0
docker push gcr.io/tsbr-cluster-demo/game-server:v0
docker push gcr.io/tsbr-cluster-demo/matchmaker:v0
docker push gcr.io/tsbr-cluster-demo/api:v0
docker push gcr.io/tsbr-cluster-demo/autoscaler:v0





docker build game_server -t gcr.io/typespeed-br/game-server:v0
docker push gcr.io/typespeed-br/game-server:v0


docker build game_server_dummy -t gcr.io/typespeed-br/game-server-dummy:v0
docker push gcr.io/typespeed-br/game-server-dummy:v0
