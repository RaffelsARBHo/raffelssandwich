// lib/rateLimiter.ts
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = 0;
  private readonly maxParallel = 6;
  private readonly minInterval = 150;
  private lastRequestTime = 0;

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          // Ensure minimum time between requests
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          
          if (timeSinceLastRequest < this.minInterval) {
            await new Promise(r => setTimeout(r, this.minInterval - timeSinceLastRequest));
          }
          
          this.lastRequestTime = Date.now();
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.processing--;
          this.processNext();
        }
      });
      this.processNext();
    });
  }

  private processNext() {
    if (this.processing >= this.maxParallel || this.queue.length === 0) {
      return;
    }

    this.processing++;
    const task = this.queue.shift();
    if (task) {
      task();
    }
  }
}

export const accurateRateLimiter = new RateLimiter();