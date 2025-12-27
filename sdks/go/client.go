package aurigraph

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"
)

// Client represents the Aurigraph SDK client
type Client struct {
	config    *ClientConfig
	httpClient *http.Client
	connected bool
	mu        sync.RWMutex
}

// NewClient creates a new Aurigraph client
//
// Example:
//
//	client := NewClient(&ClientConfig{
//	    BaseURL: "https://dlt.aurigraph.io/api/v11",
//	    APIKey:  "sk_...",
//	    Timeout: 30000,
//	})
func NewClient(config *ClientConfig) *Client {
	if config.Timeout == 0 {
		config.Timeout = 30000
	}

	return &Client{
		config: config,
		httpClient: &http.Client{
			Timeout: time.Duration(config.Timeout) * time.Millisecond,
		},
		connected: false,
	}
}

// Connect establishes connection to the Aurigraph network
func (c *Client) Connect(ctx context.Context) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	req, err := http.NewRequestWithContext(ctx, "GET", c.config.BaseURL+"/health", nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	c.addHeaders(req)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to connect to Aurigraph: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("health check failed with status %d", resp.StatusCode)
	}

	c.connected = true
	fmt.Println("✅ Connected to Aurigraph network")
	return nil
}

// Disconnect closes the connection from the network
func (c *Client) Disconnect(ctx context.Context) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.connected = false
	fmt.Println("✅ Disconnected from Aurigraph network")
	return nil
}

// IsConnected checks if client is connected
func (c *Client) IsConnected() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.connected
}

// GetAccount retrieves account information
func (c *Client) GetAccount(ctx context.Context, address string) (*Account, error) {
	if !c.IsConnected() {
		return nil, fmt.Errorf("client not connected")
	}

	url := fmt.Sprintf("%s/accounts/%s", c.config.BaseURL, address)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	c.addHeaders(req)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get account: status %d", resp.StatusCode)
	}

	var account Account
	if err := json.NewDecoder(resp.Body).Decode(&account); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &account, nil
}

// GetBalance retrieves the balance for an address
func (c *Client) GetBalance(ctx context.Context, address string) (string, error) {
	account, err := c.GetAccount(ctx, address)
	if err != nil {
		return "", fmt.Errorf("failed to get balance: %w", err)
	}
	return account.Balance, nil
}

// SubmitTransaction submits a transaction to the network
func (c *Client) SubmitTransaction(ctx context.Context, tx map[string]interface{}) (*Transaction, error) {
	if !c.IsConnected() {
		return nil, fmt.Errorf("client not connected")
	}

	txJSON, err := json.Marshal(tx)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal transaction: %w", err)
	}

	url := fmt.Sprintf("%s/transactions", c.config.BaseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(txJSON))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	c.addHeaders(req)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to submit transaction: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to submit transaction: status %d, body: %s", resp.StatusCode, string(body))
	}

	var transaction Transaction
	if err := json.NewDecoder(resp.Body).Decode(&transaction); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &transaction, nil
}

// GetTransaction retrieves transaction details
func (c *Client) GetTransaction(ctx context.Context, hash string) (*Transaction, error) {
	if !c.IsConnected() {
		return nil, fmt.Errorf("client not connected")
	}

	url := fmt.Sprintf("%s/transactions/%s", c.config.BaseURL, hash)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	c.addHeaders(req)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get transaction: status %d", resp.StatusCode)
	}

	var transaction Transaction
	if err := json.NewDecoder(resp.Body).Decode(&transaction); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &transaction, nil
}

// GetLatestBlock retrieves the latest block on the blockchain
func (c *Client) GetLatestBlock(ctx context.Context) (*Block, error) {
	if !c.IsConnected() {
		return nil, fmt.Errorf("client not connected")
	}

	url := fmt.Sprintf("%s/blocks/latest", c.config.BaseURL)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	c.addHeaders(req)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get latest block: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get latest block: status %d", resp.StatusCode)
	}

	var block Block
	if err := json.NewDecoder(resp.Body).Decode(&block); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &block, nil
}

// addHeaders adds required headers to the request
func (c *Client) addHeaders(req *http.Request) {
	req.Header.Set("Content-Type", "application/json")
	if c.config.APIKey != "" {
		req.Header.Set("X-API-Key", c.config.APIKey)
	}
}
