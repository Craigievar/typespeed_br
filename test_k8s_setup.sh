kubectl apply -f game/service.yaml
kubectl apply -f game/pod.yaml

kubectl apply -f matchmaker/service.yaml
kubectl apply -f matchmaker/pod.yaml

# this is internal for now, does't need service
kubectl apply -f game_instance_manager/pod.yaml

# this we directly expose, doesn't need service
kubectl apply -f game_server/pod.yaml
