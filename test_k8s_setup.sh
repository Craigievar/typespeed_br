kubectl label nodes gke-hello-cluster-default-pool-184e5807-6xt7 role=game-instance-manager-server
kubectl label nodes gke-hello-cluster-default-pool-184e5807-937p role=matchmaker
kubectl label nodes gke-hello-cluster-pool-1-c35d7dd9-0zcz role=game-assets-server
kubectl label nodes gke-hello-cluster-pool-1-c35d7dd9-pnqc role=game-server


kubectl apply -f game/service.yaml
kubectl apply -f game/pod.yaml

kubectl apply -f matchmaker/service.yaml
kubectl apply -f matchmaker/pod.yaml

# this is internal for now, does't need service
kubectl apply -f game_instance_manager/pod.yaml

# this we directly expose, doesn't need service
kubectl apply -f game_server/pod.yaml
