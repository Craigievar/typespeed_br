This is a container running in the GIM pod. All it does is create a proxy to
the Agones API in Kubernetes. This allows the GIM to securely request a
gameserver, which it just forwards to the matchmaking server.
