kubectl label nodes minikube role=apps

# apply all of the pod yamls
kubectl apply -f game/pod.yaml
kubectl apply -f matchmaker/pod.yaml
kubectl apply -f game_instance_manager/pod.yaml
kubectl apply -f game_server/pod.yaml

# apply the services that are needed
kubectl apply -f game/service.yaml
kubectl apply -f matchmaker/service.yaml
kubectl apply -f game_instance_manager/service.yaml
