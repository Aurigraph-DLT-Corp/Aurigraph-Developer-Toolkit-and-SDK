package aurigraph

// ClientConfig represents configuration for the Aurigraph client
type ClientConfig struct {
	BaseURL string
	APIKey  string
	Timeout int // timeout in milliseconds
}

// Account represents account information on the blockchain
type Account struct {
	Address   string `json:"address"`
	Balance   string `json:"balance"`
	Nonce     int64  `json:"nonce"`
	PublicKey string `json:"publicKey"`
}

// Transaction represents a blockchain transaction
type Transaction struct {
	Hash      string `json:"hash"`
	From      string `json:"from"`
	To        string `json:"to"`
	Amount    string `json:"amount"`
	Nonce     int64  `json:"nonce"`
	Timestamp int64  `json:"timestamp"`
	Status    string `json:"status"` // pending, confirmed, failed
}

// Block represents a blockchain block
type Block struct {
	Hash      string `json:"hash"`
	Height    int64  `json:"height"`
	Timestamp int64  `json:"timestamp"`
	PrevHash  string `json:"prevHash"`
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status string `json:"status"`
}
