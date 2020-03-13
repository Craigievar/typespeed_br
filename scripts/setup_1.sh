# project
docker login
gcloud config set project typespeed-br

# https://agones.dev/site/docs/installation/creating-cluster/gke/
gcloud config set compute/zone us-west1-a
gcloud components install kubectl
gcloud container clusters create [CLUSTER_NAME] --cluster-version=1.14 \
  --tags=game-server \
  --scopes=gke-default \
  --num-nodes=2 \
  --no-enable-autoupgrade \
  --machine-type=n1-standard-2

gcloud container node-pools create agones-system \
  --cluster=typespeed-br \
  --no-enable-autoupgrade \
  --node-taints agones.dev/agones-system=true:NoExecute \
  --node-labels agones.dev/agones-system=true \
  --num-nodes=1


curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh

helm init
helm repo add agones https://agones.dev/chart/stable
helm install --name my-release --namespace agones-system agones/agones

# firewall permissions
gcloud compute firewall-rules create game-server-firewall \
  --allow udp:7000-8000 \
  --target-tags game-server \
  --description "Firewall to allow game server udp traffic"

# build dockers in case we haven't
sh scripts/docker_setup.sh

kubectl apply -f game_instance_manager_sidecar/rbac.yaml

# this goes first so that MM can reference it
kubectl apply -f game_instance_manager/service.yaml
# then this so that game servers can reference it!
kubectl apply -f matchmaker/service.yaml

# pods, static game asset service
# TODO: feed matchmaking server into game file.
kubectl apply -f scripts/setup_2.yaml

# finally set up the fleet
kubectl apply -f agones/fleet.yaml
kubectl apply -f agones/fleet_auto_scaler.yaml

kubectl apply -f game_instance_manager_sidecar/rbac.yaml

# this goes first so that MM can reference it
kubectl apply -f game_instance_manager/service.yaml
# then this so that game servers can reference it!
kubectl apply -f matchmaker/service.yaml

# pods, static game asset service
# TODO: feed matchmaking server into game file.
kubectl apply -f scripts/setup_2.yaml

# finally set up the fleet
kubectl apply -f agones/fleet.yaml
kubectl apply -f agones/fleet_auto_scaler.yaml
