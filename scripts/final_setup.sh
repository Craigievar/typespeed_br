# project
gcloud config set project tsbr-cluster-demo

# firewall permissions
gcloud compute firewall-rules create my-rule --allow=tcp:7000-8000

kubectl label nodes gke-hello-cluster-default-pool-184e5807-6xt7 role=apps --overwrite=True
kubectl label nodes gke-hello-cluster-default-pool-184e5807-937p role=apps --overwrite=True
kubectl label nodes gke-hello-cluster-pool-1-c35d7dd9-0zcz role=apps --overwrite=True
kubectl label nodes gke-hello-cluster-pool-1-c35d7dd9-pnqc role=game-server --overwrite=True

kubectl apply -f api/rbac.yaml
kubectl apply -f matchmaker/service.yaml

kubectl apply -f scripts/setup_post_mm.yaml
#IP range is 10.51.240.0 - 10.51.255.255
# Note services are in env like KUBE_API_SERVICE_SERVICE_HOST, we don't even have to specify them in yamls!!!
