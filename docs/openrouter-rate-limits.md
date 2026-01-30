# OpenRouter Rate Limiting Policy

**Last Updated**: 2026-01-30

## Overview
OpenRouter implements tiered rate limiting based on account status and credit balance. Understanding these limits is critical for production deployments.

## Free Tier Limits
- **Daily Quota**: 50 requests/day
- **Rate Limit**: 20 requests per minute (RPM)
- **Models**: Only models with `:free` suffix (e.g., `qwen/qwen-2-7b-instruct:free`)
- **Error Code**: `429: Rate limit exceeded`

**Note**: Free tier applies to all users who have never purchased credits.

## Paid Tier Limits
Users who have purchased **at least $10 in credits** receive enhanced limits:

### Daily Quota
- **1,000 requests/day** for free models (`:free` suffix)
- Unlimited requests for paid models (subject to RPS limits)

### Rate Limits (RPS)
- **Dynamic scaling**: 1 RPS per $1 of account balance
- **Minimum**: 1 RPS (even with <$1 balance)
- **Maximum**: 500 RPS (default cap, even with >$500 balance)
- **Decreases** as balance is consumed

**Example**:
- $5 balance = 5 RPS
- $15 balance = 15 RPS
- $100 balance = 100 RPS
- $600 balance = 500 RPS (capped)

## Global Protections
- **Cloudflare DDoS Protection**: Blocks excessive usage patterns
- **Negative Balance Block**: `402: Insufficient credits` error for all requests (including free models)

## Monitoring Your Usage

### Check Account Status
```bash
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  https://openrouter.ai/api/v1/key
```

**Response Fields**:
- `usage_daily`: Credits used today
- `limit_remaining`: Remaining credits
- `byok_usage_daily`: External BYOK usage
- `is_free_tier`: `true` if never paid

### Example Response
```json
{
  "data": {
    "label": "My API Key",
    "usage": 4.23,
    "limit": 15.87,
    "is_free_tier": false,
    "rate_limit": {
      "requests": 15,
      "interval": "second"
    }
  }
}
```

## Error Codes
| Code | Meaning | Solution |
|------|---------|----------|
| `401` | Unauthorized / Invalid Key | Verify `OPENROUTER_API_KEY` is correct |
| `402` | Insufficient Credits | Add credits or wait for balance to clear |
| `429` | Rate Limit Exceeded | Slow down requests or upgrade tier |

**Note**: OpenRouter sometimes returns `401` for rate limit issues instead of `429`.

## Best Practices

### 1. Use Free Models When Possible
Models ending in `:free` are significantly cheaper and count toward the 1,000/day quota for paid users.

**Example**:
- `google/gemini-2.5-flash-lite:free` (if available)
- `qwen/qwen-2-7b-instruct:free`
- `meta-llama/llama-3-8b-instruct:free`

### 2. Implement Rate Limiting
For paid tier with $15 balance (15 RPS):
```typescript
const DELAY_MS = 1000 / 15; // ~67ms between requests
await sleep(DELAY_MS);
```

### 3. Monitor Balance
Check balance periodically to avoid mid-run failures:
```bash
# Get remaining credits
curl -s -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  https://openrouter.ai/api/v1/key | jq '.data.limit'
```

### 4. Use Circuit Breakers
Implement fail-fast logic to detect rate limit errors early and abort gracefully.

## BYOK (Bring Your Own Key)
- **Fee**: 5% on OpenRouter credits
- **Waived**: First 1M requests/month
- **Benefit**: Direct control over provider rate limits
- **Use Case**: High-volume production workloads

## Credit Management
- **Free credits**: Do not expire (unless unused for >1 year)
- **Purchased credits**: Non-refundable
- **Negative balance**: Blocks all requests until resolved

## Production Recommendations
1. **Minimum Balance**: Maintain $20+ for consistent 20 RPS
2. **Monitoring**: Set up alerts when balance drops below $5
3. **Fallback Models**: Configure multiple model options in case primary is unavailable
4. **Throttling**: Implement adaptive rate limiting based on current RPS allowance

## References
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [API Key Management](https://openrouter.ai/keys)
- [Model Pricing](https://openrouter.ai/models)
