package main

import (
	"log"
	"net/http"
	"time"

	"netdiag/handlers"
)

func main() {
	mux := http.NewServeMux()

	// Static assets
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("./static"))))

	// UI
	mux.HandleFunc("/", handlers.IndexHandler)

	// Ping API
	mux.HandleFunc("/api/ping/single", handlers.PingSingleHandler)
	mux.HandleFunc("/api/ping/multiple", handlers.PingMultipleHandler)
	mux.HandleFunc("/api/ping/continuous/start", handlers.PingContinuousStartHandler)
	mux.HandleFunc("/api/ping/continuous/stop", handlers.PingContinuousStopHandler)
	mux.HandleFunc("/api/ping/continuous/stopall", handlers.PingContinuousStopAllHandler)
	mux.HandleFunc("/api/ping/status", handlers.PingStatusHandler)
	mux.HandleFunc("/api/ping/stream", handlers.PingStreamHandler)

	// DNS API
	mux.HandleFunc("/api/dns/resolve", handlers.DNSResolveHandler)
	mux.HandleFunc("/api/dns/bulk", handlers.DNSBulkHandler)

	// SSL API
	mux.HandleFunc("/api/ssl/analyze", handlers.SSLAnalyzeHandler)
	mux.HandleFunc("/api/ssl/bulk", handlers.SSLBulkHandler)

	srv := &http.Server{
		Addr:         ":21121",
		Handler:      mux,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 120 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	log.Println("NetDiag Tool → http://localhost:21121")
	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
