# Aurigraph V10 - Default Configuration

## 🎯 Classical Version is Now Default

The Aurigraph V10 platform now uses the **Classical (CPU/GPU) version** as the default configuration. This provides high performance without requiring quantum computing hardware.

## Why Classical as Default?

1. **Accessibility**: Works on standard server hardware
2. **Cost-Effective**: $50-100K vs $5-10M for quantum
3. **Production-Ready**: Proven GPU technology
4. **High Performance**: 500K TPS with GPU acceleration
5. **Easy Deployment**: Standard Docker/Kubernetes

## Quick Start (Classical - Default)

```bash
# Clone the repository
git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git
cd aurigraph-av10-7

# Install dependencies
npm install

# Build classical version (default)
npm run build:classical

# Start the platform (uses classical by default)
npm start

# Or explicitly run classical
npm run start:classical
```

## Docker Deployment (Default)

```bash
# Build default Docker image (classical)
docker build -t aurigraph:latest .

# Run with GPU support
docker run -d \
  --gpus all \
  -p 3100:3100 \
  --name aurigraph \
  aurigraph:latest

# Run without GPU (CPU only)
docker run -d \
  -p 3100:3100 \
  --name aurigraph \
  aurigraph:latest
```

## Default Hardware Requirements

### Minimum (Classical)
- CPU: 32 cores
- RAM: 256GB
- GPU: 2x NVIDIA RTX 4090 (optional)
- Storage: 10TB SSD

### Recommended (Classical)
- CPU: 64+ cores AMD EPYC
- RAM: 512GB
- GPU: 4x NVIDIA A100
- Storage: 50TB NVMe

## Performance (Classical Default)

- **Throughput**: 500K TPS
- **Latency**: <100ms
- **GPU Speedup**: 100x for ML tasks
- **Resource Efficiency**: 85%+
- **Availability**: 99.9%

## API Endpoints (Classical)

The default API endpoints are optimized for classical computing:

- `GET /health` - System health with hardware info
- `GET /api/classical/metrics` - Performance metrics
- `POST /api/classical/gpu/execute` - GPU-accelerated tasks
- `POST /api/classical/orchestrate` - AI orchestration
- `GET /api/classical/benchmark` - Performance testing

## Switching to Quantum Version

If you have access to quantum hardware and need maximum performance:

```bash
# Checkout quantum branch
git checkout quantum-version

# Build quantum version
npm run build:quantum

# Run with quantum hardware
QUANTUM_HARDWARE=true npm run start:quantum
```

## Configuration Options

### Environment Variables

```bash
# Classical (Default)
NODE_ENV=production
CUDA_VISIBLE_DEVICES=all    # GPU selection
TF_FORCE_GPU_ALLOW_GROWTH=true
PORT=3100

# Optional: Force CPU-only mode
FORCE_CPU_ONLY=true
```

### Package Scripts

```json
{
  "scripts": {
    "start": "npm run start:classical",     // Default
    "start:classical": "...",                // Explicit classical
    "start:quantum": "...",                  // Quantum (if available)
    "build": "npm run build:classical",      // Default build
    "benchmark": "npm run benchmark:classical"
  }
}
```

## Migration from Quantum

If migrating from quantum to classical (default):

1. **No API Changes**: Same endpoints work
2. **Performance Adjustment**: Expect 500K TPS instead of 1M+
3. **Remove Quantum Dependencies**: Not needed for classical
4. **Update Hardware**: Standard GPUs instead of quantum

## Cost Comparison

### Classical (Default) - Annual
- Hardware: $50-100K (one-time)
- Operating: $120K/year
- Total Year 1: $170-220K

### Quantum (Optional) - Annual
- Hardware: $5-10M (one-time)
- Operating: $5M/year
- Total Year 1: $10-15M

## Support

- **Issues**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues
- **Documentation**: https://docs.aurigraph.io/v10
- **Discord**: https://discord.gg/aurigraph
- **Email**: support@aurigraph.io

## License

Enterprise License - Contact sales@aurigraph.io

---

**Note**: The Classical version is now the default as it provides excellent performance (500K TPS) without requiring specialized quantum hardware. For organizations needing absolute maximum performance (1M+ TPS) and having access to quantum computing resources, the Quantum version remains available in the `quantum-version` branch.