# clean up
kubectl delete pods --all
kubectl delete deployments --all
kubectl delete services --all

# set up a singleton set of things, but strung
# together automatically (NOT using APIs)

# fixed gameserver. We need to expose it in minikube
# until we can figure out an "external IP"
# for the hostnetwork
kubectl apply -f game_server/pod_local.yaml
kubectl expose pod game-server --type=NodePort --port 7008
GAMESERVER_URL=`minikube service game-server --url`
echo "Gameserver set up is on ${GAMESERVER_URL}"

#using gameserver, set up the instance manager
kubectl apply -f game_instance_manager/pod_local.yaml
kubectl expose pod game-instance-manager --type=NodePort --port 8002
GIM_URL=`minikube service game-instance-manager --url`
echo "Game Instance Manager set up is on ${GIM_URL}"
