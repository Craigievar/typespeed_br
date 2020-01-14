

#IP range is 10.51.240.0 - 10.51.255.255
# Note services are in env like KUBE_API_SERVICE_SERVICE_HOST, we don't even have to specify them in yamls!!!
kubectl apply -f api/pod.yaml
kubectl apply -f api/service.yaml

kubectl apply -f game_instance_manager/pod.yaml
kubectl apply -f game_instance_manager/service.yaml

kubectl apply -f matchmaker/pod.yaml

kubectl apply -f game/pod.yaml
kubectl apply -f game/service.yaml