# Lightweight unix version
FROM alpine:3.10.1
# Pull kubernetes so we can run kubernetes proxy
ADD https://storage.googleapis.com/kubernetes-release/release/v1.14.10/bin/linux/amd64/kubectl /usr/local/bin/kubectl
RUN chmod +x /usr/local/bin/kubectl
EXPOSE 8001
ENTRYPOINT ["/usr/local/bin/kubectl", "proxy"]
