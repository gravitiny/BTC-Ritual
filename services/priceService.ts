
type PriceCallback = (price: number) => void;

class PriceFeed {
  private ws: WebSocket | null = null;
  private latestPrice: number = 0;
  private subscribers: Set<PriceCallback> = new Set();
  private reconnectTimeout: number = 5000;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
      
      this.ws.onopen = () => {
        const subscribeMsg = {
          type: 'subscribe',
          channels: [{ name: 'ticker', product_ids: ['BTC-USD'] }]
        };
        this.ws?.send(JSON.stringify(subscribeMsg));
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'ticker' && data.price) {
          const price = parseFloat(data.price);
          this.latestPrice = price;
          this.subscribers.forEach(cb => cb(price));
        }
      };

      this.ws.onclose = () => {
        setTimeout(() => this.connect(), this.reconnectTimeout);
      };

      this.ws.onerror = (err) => {
        console.error('WS Error:', err);
        this.ws?.close();
      };
    } catch (e) {
      console.error('Failed to connect to price feed:', e);
    }
  }

  public subscribe(cb: PriceCallback): () => void {
    this.subscribers.add(cb);
    if (this.latestPrice > 0) cb(this.latestPrice);
    return () => this.subscribers.delete(cb);
  }

  public getLatest(): number {
    return this.latestPrice;
  }
}

export const priceFeed = new PriceFeed();
