# project

# make project (here typespeed_br)
# tsbr-1
docker login
gcloud config set project typespeed-br

# https://agones.dev/site/docs/installation/creating-cluster/gke/
gcloud config set compute/zone us-west1-a
gcloud components install kubectl

#go to kubernetes engine and enable
# https://console.cloud.google.com/projectselector2/apis/ and enable kubernetes
gcloud container clusters create server-cluster --cluster-version=1.14 \
  --tags=game-server \
  --scopes=gke-default \
  --num-nodes=2 \
  --no-enable-autoupgrade \
  --machine-type=n1-standard-2

gcloud container node-pools create agones-system \
  --cluster=server-cluster \
  --no-enable-autoupgrade \
  --node-taints agones.dev/agones-system=true:NoExecute \
  --node-labels agones.dev/agones-system=true \
  --num-nodes=1

curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh

helm init
helm repo add agones https://agones.dev/chart/stable
helm install my-release agones/agones

# firewall permissions
gcloud compute firewall-rules create game-server-firewall \
  --allow tcp:7000-8000 \
  --target-tags game-server \
  --description "Firewall to allow game server tcp traffic"

git clone https://github.com/Craigievar/typespeed_br.git
# build dockers in case we haven't
cd typespeed_br
sh scripts/docker_setup.sh

kubectl apply -f game_instance_manager_sidecar/rbac.yaml

# this goes first so that MM can reference it
kubectl apply -f game_instance_manager/service.yaml
kubectl apply -f matchmaker/service.yaml
kubectl apply -f game/service.yaml

#hooks
# game server pods reference game service (in server.js CODE) for socket whitelist
# matchmaker references gim service (YAML)

# pods, static game asset service -- actually, add mm in server.js
# TODO: feed matchmaking server into game file.
kubectl apply -f scripts/setup_2.yaml

# finally set up the fleet
kubectl apply -f agones/fleet.yaml
kubectl apply -f agones/fleet_auto_scaler.yaml
