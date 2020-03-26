package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"github.com/kapp-staging/kapp/api/client"
	"github.com/kapp-staging/kapp/api/utils"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
	"io"
	v1 "k8s.io/api/core/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd/api"
	"net/http"
	"strings"
	"sync"
)

type WSConn struct {
	*websocket.Conn
	ctx                        context.Context
	K8sClient                  *kubernetes.Clientset
	IsAuthorized               bool
	subAndUnsubRequestsChannel chan *WSSubscribeOrUnsubscribePodLogRequest
	writeLock                  *sync.Mutex
}

func (conn *WSConn) WriteJSON(v interface{}) error {
	conn.writeLock.Lock()
	defer conn.writeLock.Unlock()
	return conn.Conn.WriteJSON(v)
}

type WSRequestType string

const (
	WSRequestTypeAuth              WSRequestType = "auth"
	WSRequestTypeAuthStatus        WSRequestType = "authStatus"
	WSRequestTypeSubscribePodLog   WSRequestType = "subscribePodLog"
	WSRequestTypeUnsubscribePodLog WSRequestType = "unsubscribePodLog"
)

type WSRequest struct {
	Type WSRequestType `json:"type"`
}

type WSClientAuthRequest struct {
	WSRequest `json:",inline"`
	AuthToken string `json:"authToken"`
}

type WSSubscribeOrUnsubscribePodLogRequest struct {
	WSRequest `json:",inline"`
	PodName   string `json:"podName"`
	Namespace string `json:"namespace"`
}

type StatusValue int

const StatusOK StatusValue = 0
const StatusError StatusValue = -1

type WSResponseType string

const (
	WSResponseTypeCommon                WSResponseType = "common"
	WSResponseTypeAuthResult            WSResponseType = "authResult"
	WSResponseTypeAuthStatus            WSResponseType = "authStatus"
	WSResponseTypeLogStreamUpdate       WSResponseType = "logStreamUpdate"
	WSResponseTypeLogStreamDisconnected WSResponseType = "logStreamDisconnected"
)

type WSResponse struct {
	Type    WSResponseType `json:"type"`
	Status  StatusValue    `json:"status"`
	Message string         `json:"message"`
}

type WSPodLogResponse struct {
	Type      WSResponseType `json:"type"`
	Namespace string         `json:"namespace"`
	PodName   string         `json:"podName"`
	Data      string         `json:"data"`
}

type WSPodLogDisconnectedResponse struct {
	Type      WSResponseType `json:"type"`
	Namespace string         `json:"namespace"`
	PodName   string         `json:"podName"`
	Data      string         `json:"data"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(*http.Request) bool {
		return true
	},
}

func isNormalWebsocketCloseError(err error) bool {
	return websocket.IsCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure, websocket.CloseNoStatusReceived)
}

func logWsReadLoop(conn *WSConn, clientManager *client.ClientManager) (err error) {
	for {
		_, message, err := conn.ReadMessage()

		if err != nil {
			if isNormalWebsocketCloseError(err) {
				return nil
			}
			log.Error(err)
			return err
		}

		var basicMessage WSRequest
		err = json.Unmarshal(message, &basicMessage)

		if err != nil {
			log.Error(err)
			continue
		}

		res := WSResponse{
			Type:   WSResponseTypeCommon,
			Status: StatusError,
		}

		switch basicMessage.Type {
		case WSRequestTypeAuth:
			res.Type = WSResponseTypeAuthResult
			var m WSClientAuthRequest
			err = json.Unmarshal(message, &m)

			if err != nil {
				log.Error(err)
				continue
			}

			authInfo := &api.AuthInfo{Token: m.AuthToken}

			if clientManager.IsAuthInfoWorking(authInfo) == nil {
				cfg, err := clientManager.GetClientConfigWithAuthInfo(authInfo)

				if err != nil {
					log.Error(err)
					continue
				}

				k8sClient, err := kubernetes.NewForConfig(cfg)

				if err != nil {
					log.Error(err)
					continue
				}

				conn.K8sClient = k8sClient
				conn.IsAuthorized = true

				res.Status = StatusOK
				res.Message = "Auth Successfully"
			} else {
				res.Message = "Invalid Auth Token"
			}
		case WSRequestTypeSubscribePodLog, WSRequestTypeUnsubscribePodLog:
			isAuthorized := conn.IsAuthorized

			if !isAuthorized {
				res.Message = "Unauthorized, Please verify yourself first."
				break
			}

			var m WSSubscribeOrUnsubscribePodLogRequest
			err = json.Unmarshal(message, &m)

			if err != nil {
				log.Error(err)
				continue
			}

			conn.subAndUnsubRequestsChannel <- &m

			res.Status = StatusOK
			res.Message = "Request Success"
		case WSRequestTypeAuthStatus:
			res.Type = WSResponseTypeAuthStatus
			if conn.IsAuthorized {
				res.Status = StatusOK
				res.Message = "You are authorized"
			} else {
				res.Message = "You are not authorized"
			}
		default:
			res.Message = "Unknown Message Type"
		}

		err = conn.WriteJSON(res)

		if err != nil {
			if !isNormalWebsocketCloseError(err) {
				log.Error(err)
			}
			return err
		}
	}
}

func logWsWriteLoop(conn *WSConn) {
	podRegistrations := make(map[string]context.CancelFunc)

	defer func() {
		for _, cancelFunc := range podRegistrations {
			cancelFunc()
		}
	}()

	for {
		select {
		case <-conn.ctx.Done():
			return
		case m := <-conn.subAndUnsubRequestsChannel:
			key := fmt.Sprintf("%s___%s", m.Namespace, m.PodName)

			if m.Type == WSRequestTypeSubscribePodLog {
				k8sClient := conn.K8sClient

				lines := int64(300)

				podLogOpts := v1.PodLogOptions{
					Follow:    true,
					TailLines: &lines,
				}

				req := k8sClient.CoreV1().Pods(m.Namespace).GetLogs(m.PodName, &podLogOpts)
				podLogs, err := req.Stream()

				if err != nil {
					log.Error(err)
					_ = conn.WriteJSON(&WSPodLogDisconnectedResponse{
						Type:      WSResponseTypeLogStreamDisconnected,
						Namespace: m.Namespace,
						PodName:   m.PodName,
						Data:      err.Error(),
					})
					continue
				}

				ctx, stop := context.WithCancel(conn.ctx)
				if oldStop, existing := podRegistrations[key]; existing {
					oldStop()
				}
				podRegistrations[key] = stop

				go func() {
					copyPodLogStreamToWS(ctx, m.Namespace, m.PodName, conn, podLogs)
					delete(podRegistrations, key)
				}()
			} else {
				if stop, existing := podRegistrations[key]; existing {
					stop()
					delete(podRegistrations, key)
				}
			}
		}
	}
}

func copyPodLogStreamToWS(ctx context.Context, namespace, podName string, conn *WSConn, logStream io.ReadCloser) {
	defer logStream.Close()

	defer func() {
		// tell client we are no longer provide logs of this pod
		// It doesn't matter if the conn is closed, ignore the error
		_ = conn.WriteJSON(&WSPodLogDisconnectedResponse{
			Type:      WSResponseTypeLogStreamDisconnected,
			Namespace: namespace,
			PodName:   podName,
		})
	}()

	buf := utils.BufferPool.Get()
	defer utils.BufferPool.Put(buf)

	bufChan := make(chan []byte)

	go func() {
		// this go routine will exit when the stream is closed
		for {
			size, err := logStream.Read(buf)

			if err != nil {
				if !strings.Contains(err.Error(), "body closed") {
					log.Error(err)
				}
				close(bufChan)
				return
			}

			bufChan <- buf[:size]
		}
	}()

	for {
		select {
		case <-ctx.Done():
			return
		case data, ok := <-bufChan:
			if !ok {
				return
			}

			err := conn.WriteJSON(&WSPodLogResponse{
				Type:      WSResponseTypeLogStreamUpdate,
				Namespace: namespace,
				PodName:   podName,
				Data:      string(data),
			})

			if err != nil {

				if !isNormalWebsocketCloseError(err) {
					log.Error(err)
				}
				return
			}
		}
	}
}

func (h *ApiHandler) logWebsocketHandler(c echo.Context) error {
	ws, err := upgrader.Upgrade(c.Response(), c.Request(), nil)

	if err != nil {
		log.Error("upgrade:", err)
		return err
	}

	authInfo := client.ExtractAuthInfo(c)
	ctx, stop := context.WithCancel(context.Background())

	conn := &WSConn{
		Conn:                       ws,
		ctx:                        ctx,
		subAndUnsubRequestsChannel: make(chan *WSSubscribeOrUnsubscribePodLogRequest),
		IsAuthorized:               authInfo != nil && h.clientManager.IsAuthInfoWorking(authInfo) == nil,
		writeLock:                  &sync.Mutex{},
	}

	if conn.IsAuthorized {
		clientConfig, err := h.clientManager.GetClientConfig(c)

		if err != nil {
			return err
		}

		k8sClient, err := kubernetes.NewForConfig(clientConfig)

		if err != nil {
			return err
		}

		conn.K8sClient = k8sClient
	}

	defer conn.Close()
	defer stop()

	// handle k8s api logs stream -> client
	go logWsWriteLoop(conn)

	// handle client request
	_ = logWsReadLoop(conn, h.clientManager)

	return nil
}