# project
gcloud config set project tsbr-cluster-demo

# firewall permissions
gcloud compute firewall-rules create my-rule --allow=tcp:7000-8000

# make default service accounts admins for kube api
# should clean this up later!!!
kubectl apply -f api/rbac.yaml

kubectl apply -f api/pod.yaml
kubectl apply -f api/service.yaml
