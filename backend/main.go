package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
	"gopkg.in/yaml.v3"
)

type Config struct {
	Server struct {
		Port string `yaml:"port"`
	} `yaml:"server"`
	OIDC struct {
		Issuer       string   `yaml:"issuer"`
		ClientID     string   `yaml:"clientId"`
		ClientSecret string   `yaml:"clientSecret"`
		RedirectURI  string   `yaml:"redirectUri"`
		Scopes       []string `yaml:"scopes"`
	} `yaml:"oidc"`
	Frontend struct {
		RedirectURL string `yaml:"redirectUrl"`
	} `yaml:"frontend"`
}

var (
	cfg          Config
	provider     *oidc.Provider
	oauth2Config oauth2.Config
)

func main() {
	log.Printf("[STARTUP] Backend auth service starting...")

	// Load config
	log.Printf("[STARTUP] Loading config from config.yaml")
	configFile, err := os.ReadFile("config.yaml")
	if err != nil {
		log.Fatalf("[STARTUP] Failed to read config: %v", err)
	}
	if err := yaml.Unmarshal(configFile, &cfg); err != nil {
		log.Fatalf("[STARTUP] Failed to parse config: %v", err)
	}

	log.Printf("[STARTUP] Config loaded - Issuer: %s, ClientID: %s, RedirectURI: %s",
		cfg.OIDC.Issuer, cfg.OIDC.ClientID, cfg.OIDC.RedirectURI)
	log.Printf("[STARTUP] Frontend redirect URL: %s", cfg.Frontend.RedirectURL)

	// Initialize OIDC provider
	ctx := context.Background()
	log.Printf("[STARTUP] Connecting to OIDC provider: %s", cfg.OIDC.Issuer)
	provider, err = oidc.NewProvider(ctx, cfg.OIDC.Issuer)
	if err != nil {
		log.Fatalf("[STARTUP] Failed to create OIDC provider: %v", err)
	}
	log.Printf("[STARTUP] OIDC provider connected successfully")

	// Setup OAuth2 config
	oauth2Config = oauth2.Config{
		ClientID:     cfg.OIDC.ClientID,
		ClientSecret: cfg.OIDC.ClientSecret,
		RedirectURL:  cfg.OIDC.RedirectURI,
		Endpoint:     provider.Endpoint(),
		Scopes:       cfg.OIDC.Scopes,
	}
	log.Printf("[STARTUP] OAuth2 config: TokenURL=%s, AuthURL=%s",
		oauth2Config.Endpoint.TokenURL, oauth2Config.Endpoint.AuthURL)

	// Routes
	http.HandleFunc("/api/auth/callback", handleCallback)
	http.HandleFunc("/api/auth/refresh", handleRefresh)
	http.HandleFunc("/api/auth/revoke", handleRevoke)
	http.HandleFunc("/health", handleHealth)
	http.HandleFunc("/ready", handleReady)

	log.Printf("[STARTUP] Server starting on port %s", cfg.Server.Port)
	log.Printf("[STARTUP] Endpoints:")
	log.Printf("[STARTUP]   - POST /api/auth/callback")
	log.Printf("[STARTUP]   - POST /api/auth/refresh")
	log.Printf("[STARTUP]   - POST /api/auth/revoke")
	log.Printf("[STARTUP]   - GET  /health")
	log.Printf("[STARTUP]   - GET  /ready")

	if err := http.ListenAndServe(":"+cfg.Server.Port, nil); err != nil {
		log.Fatalf("[STARTUP] Server failed: %v", err)
	}
}

func handleCallback(w http.ResponseWriter, r *http.Request) {
	log.Printf("[CALLBACK] Received request: %s", r.URL.String())

	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")
	errParam := r.URL.Query().Get("error")

	if errParam != "" {
		errDesc := r.URL.Query().Get("error_description")
		log.Printf("[CALLBACK] Error from auth server: %s - %s", errParam, errDesc)
		http.Error(w, fmt.Sprintf("Auth error: %s - %s", errParam, errDesc), http.StatusBadRequest)
		return
	}

	if code == "" {
		log.Printf("[CALLBACK] Missing authorization code in callback")
		http.Error(w, "Missing code", http.StatusBadRequest)
		return
	}

	log.Printf("[CALLBACK] Got authorization code (length=%d), state=%s", len(code), state)

	// Exchange code for token
	ctx := r.Context()
	log.Printf("[TOKEN_EXCHANGE] Exchanging code for token with issuer: %s", cfg.OIDC.Issuer)
	log.Printf("[TOKEN_EXCHANGE] Using client_id: %s, redirect_uri: %s", cfg.OIDC.ClientID, cfg.OIDC.RedirectURI)

	token, err := oauth2Config.Exchange(ctx, code)
	if err != nil {
		log.Printf("[TOKEN_EXCHANGE] FAILED: %v", err)
		log.Printf("[TOKEN_EXCHANGE] Config - Issuer: [%s], ClientID: [%s], RedirectURI: [%s], Scopes: [%v]",
			cfg.OIDC.Issuer, cfg.OIDC.ClientID, cfg.OIDC.RedirectURI, cfg.OIDC.Scopes)
		http.Error(w, fmt.Sprintf("Token exchange failed: %v", err), http.StatusInternalServerError)
		return
	}

	log.Printf("[TOKEN_EXCHANGE] SUCCESS: Got access_token (length=%d), has_refresh=%v",
		len(token.AccessToken), token.RefreshToken != "")

	// Extract ID token
	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok {
		log.Printf("[ID_TOKEN] ID token not found in token response")
		http.Error(w, "No ID token in response", http.StatusInternalServerError)
		return
	}
	log.Printf("[ID_TOKEN] Extracted ID token (length=%d)", len(rawIDToken))

	// Verify ID token
	verifier := provider.Verifier(&oidc.Config{ClientID: cfg.OIDC.ClientID})
	log.Printf("[ID_TOKEN] Verifying ID token...")
	idToken, err := verifier.Verify(ctx, rawIDToken)
	if err != nil {
		log.Printf("[ID_TOKEN] Verification FAILED: %v", err)
		http.Error(w, fmt.Sprintf("ID token verification failed: %v", err), http.StatusInternalServerError)
		return
	}
	log.Printf("[ID_TOKEN] Verification SUCCESS")

	// Extract user claims
	var claims struct {
		Sub   string `json:"sub"`
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	if err := idToken.Claims(&claims); err != nil {
		log.Printf("[CLAIMS] Failed to parse claims: %v", err)
		http.Error(w, fmt.Sprintf("Failed to parse claims: %v", err), http.StatusInternalServerError)
		return
	}
	log.Printf("[CLAIMS] User authenticated: sub=%s, email=%s, name=%s", claims.Sub, claims.Email, claims.Name)

	// Return tokens directly to frontend
	response := map[string]interface{}{
		"access_token":  token.AccessToken,
		"id_token":      rawIDToken,
		"refresh_token": token.RefreshToken,
		"expires_in":    token.Expiry.Unix(),
		"user": map[string]string{
			"sub":   claims.Sub,
			"email": claims.Email,
			"name":  claims.Name,
		},
	}

	// Redirect to frontend with tokens in URL fragment (for SPA)
	tokenJSON, err := json.Marshal(response)
	if err != nil {
		log.Printf("[RESPONSE] Failed to marshal token response: %v", err)
		http.Error(w, "Failed to create response", http.StatusInternalServerError)
		return
	}

	redirectURL := fmt.Sprintf("%s#tokens=%s", cfg.Frontend.RedirectURL, string(tokenJSON))
	log.Printf("[REDIRECT] Redirecting to frontend: %s", cfg.Frontend.RedirectURL)
	http.Redirect(w, r, redirectURL, http.StatusFound)
}

func handleRefresh(w http.ResponseWriter, r *http.Request) {
	log.Printf("[REFRESH] Token refresh request received")

	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("[REFRESH] Failed to read request body: %v", err)
		http.Error(w, "Failed to read body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.Unmarshal(body, &req); err != nil {
		log.Printf("[REFRESH] Invalid JSON in request: %v", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.RefreshToken == "" {
		log.Printf("[REFRESH] Missing refresh_token in request")
		http.Error(w, "Missing refresh_token", http.StatusBadRequest)
		return
	}

	log.Printf("[REFRESH] Attempting to refresh token (length=%d)", len(req.RefreshToken))

	// Create token source from refresh token
	ctx := r.Context()
	token := &oauth2.Token{
		RefreshToken: req.RefreshToken,
	}
	tokenSource := oauth2Config.TokenSource(ctx, token)

	// Get new token
	newToken, err := tokenSource.Token()
	if err != nil {
		log.Printf("[REFRESH] Token refresh FAILED: %v", err)
		log.Printf("[REFRESH] Issuer: %s, ClientID: %s", cfg.OIDC.Issuer, cfg.OIDC.ClientID)
		http.Error(w, fmt.Sprintf("Token refresh failed: %v", err), http.StatusUnauthorized)
		return
	}

	log.Printf("[REFRESH] Token refresh SUCCESS: new_token_length=%d, has_new_refresh=%v",
		len(newToken.AccessToken), newToken.RefreshToken != "")

	// Return new tokens
	response := map[string]interface{}{
		"access_token":  newToken.AccessToken,
		"refresh_token": newToken.RefreshToken,
		"expires_in":    newToken.Expiry.Unix(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleRevoke(w http.ResponseWriter, r *http.Request) {
	log.Printf("[REVOKE] Token revocation request received")

	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("[REVOKE] Failed to read request body: %v", err)
		http.Error(w, "Failed to read body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var req struct {
		Token string `json:"token"`
	}
	if err := json.Unmarshal(body, &req); err != nil {
		log.Printf("[REVOKE] Invalid JSON in request: %v", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Token == "" {
		log.Printf("[REVOKE] Missing token in request")
		http.Error(w, "Missing token", http.StatusBadRequest)
		return
	}

	log.Printf("[REVOKE] Revoking token (length=%d)", len(req.Token))

	// Call Dex revocation endpoint
	revocationURL := cfg.OIDC.Issuer + "/token/revoke"
	log.Printf("[REVOKE] Calling revocation endpoint: %s", revocationURL)

	revReq, err := http.NewRequest("POST", revocationURL, nil)
	if err != nil {
		log.Printf("[REVOKE] Failed to create request: %v", err)
		http.Error(w, "Failed to create revocation request", http.StatusInternalServerError)
		return
	}

	q := revReq.URL.Query()
	q.Add("token", req.Token)
	q.Add("client_id", cfg.OIDC.ClientID)
	q.Add("client_secret", cfg.OIDC.ClientSecret)
	revReq.URL.RawQuery = q.Encode()

	client := &http.Client{}
	resp, err := client.Do(revReq)
	if err != nil {
		log.Printf("[REVOKE] Revocation request FAILED: %v", err)
		http.Error(w, fmt.Sprintf("Revocation failed: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		log.Printf("[REVOKE] Revocation endpoint returned status %d: %s", resp.StatusCode, string(respBody))
	} else {
		log.Printf("[REVOKE] Token successfully revoked")
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "revoked"})
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func handleReady(w http.ResponseWriter, r *http.Request) {
	// Check if OIDC provider is reachable
	ctx := r.Context()
	_, err := oidc.NewProvider(ctx, cfg.OIDC.Issuer)
	if err != nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{"status": "not ready"})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ready"})
}
