# project
gcloud config set project tsbr-cluster-demo

# firewall permissions
gcloud compute firewall-rules create my-rule --allow=tcp:7000-8000

kubectl label nodes gke-hello-cluster-default-pool-184e5807-6xt7 role=apps --overwrite=True
kubectl label nodes gke-hello-cluster-default-pool-184e5807-937p role=apps --overwrite=True
kubectl label nodes gke-hello-cluster-pool-1-c35d7dd9-0zcz role=apps --overwrite=True
kubectl label nodes gke-hello-cluster-pool-1-c35d7dd9-pnqc role=game-server --overwrite=True

# make default service accounts admins for kube api
# should clean this up later!!!
kubectl apply -f api/rbac.yaml

#IP range is 10.51.240.0 - 10.51.255.255
kubectl apply -f api/pod.yaml
kubectl apply -f api/service.yaml

kubectl apply -f game_instance_manager/pod.yaml
kubectl apply -f game_instance_manager/service.yaml

kubectl apply -f matchmaker/pod.yaml
kubectl apply -f matchmaker/service.yaml

kubectl apply -f game/pod.yaml
kubectl apply -f game/service.yaml