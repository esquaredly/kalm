# Install cluster

install minikube and start a cluster.

```bash
# adjust memory and cpus based on your computes
minikube start --memory 8192 --cpus 4  --kubernetes-version v1.15.0
```

# Install istioctl

```bash
# go to a dir which you want to install istioctl in
curl -L https://istio.io/downloadIstio | ISTIO_VERSION=1.5.2 sh -

# enter istio dir
cd istio-1.5.2

# export binary path
export PATH=$PWD/bin:$PATH

# install operator. operator is a k8s crd controller.
istioctl operator init

# Outputs:
#
# Using operator Deployment image: docker.io/istio/operator:1.5.2
# - Applying manifest for component Operator...
# ✔ Finished applying manifest for component Operator.
# Component Operator installed successfully.
# *** Success. ***

# check status by running the following command. Wait the pod to become ready.
# This state may last for a few minutes based on your network.
kubectl get pods -n istio-operator
```

launch istio in our cluster

```bash
# go to kapp root dir, install istio config. The operator will intall istio components for us.
kubectl apply -f resources/istiocontrolplane.yaml

# check istio components status
kubectl get pods -n istio-system

# You should be able see the following pods up and running.
# NAME                                    READY   STATUS    RESTARTS   AGE
# istio-ingressgateway-6d5cfb5dcb-n4xbz   1/1     Running   0          9h
# istiod-768488f855-vt8d7                 1/1     Running   0          9h
# kiali-7ff568c949-ql8dc                  1/1     Running   0          5h10m
# prometheus-fd997976c-qzqr5              2/2     Running   0          9h
```

# Install kapp controller

```bash
# go to kapp controller dir
make install
make run

# This terminal will continue to run the controller.
```

Start another terminal and continue.

# Install hipster application

```bash
# go to kapp controller dir
kubectl apply -f config/samples/core_v1alpha1_hipster.yaml

# check istio components status
kubectl get pods -n kapp-hipster

# You will see 12 pods. There will be 2 containers in each pod. (READY 2/2 means the pod has 2 ready containers).
```

# Some commands to view the status

This step is view status only. The following commands are very helpful for understanding the entire program.

```bash
# view istio settings of a pod

istioctl x describe pod -n kapp-hipster $(kubectl get pods -n kapp-hipster -l kapp-component=frontend -o jsonpath='{.items[0].metadata.name}')
```

```bash
# view istio sidecar iptable rules of a pod

kubectl logs $(kubectl get pods -n kapp-hipster -l kapp-component=frontend -o jsonpath='{.items[0].metadata.name}') -n kapp-hipster -c istio-init
```

```bash
# istio proxy status
istioctl proxy-status
```

```bash
# istio proxy-config of a pod
istioctl proxy-config cluster -n kapp-hipster $(kubectl get pods -n kapp-hipster -l kapp-component=frontend -o jsonpath='{.items[0].metadata.name}')

# istioctl proxy-config -h for more available commands
```

```bash
# get minikube ip
minikube ip

# 192.168.64.30
```

```bash
# get istio default ingress gateway ip
kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].nodePort}'
```

```bash
# view istio settings

kubectl get sidecars -A
kubectl get virtualservices -A
kubectl get gateways -A
kubectl get destinationrules -A
```

# Access hipster services from outside of the custer

```bash
# start a minikube tunnel. Run the following command in a new terminal. The terminal will be blocked by tunnel process. May require you to enter your password.

minikube tunnel
```

```bash
ISTIO_GATEWAY_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].nodePort}')
echo "http://$(minikube ip):$ISTIO_GATEWAY_PORT"

# in my compouter the output is
# http://192.168.64.30:31593

# open the address in a browser.
```

# Access istio kiali dashboard

```bash
# Run this command in a new terminal.

istioctl dashboard kiali

# go to graph page
# select kapp-hipster namespace
# make kapp-hipster requests from browser and view graph changes
```