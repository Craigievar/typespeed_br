# need to figure out a better solution to tell the client js code where the MM service is.

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

kubectl apply -f matchmaker/service.yaml