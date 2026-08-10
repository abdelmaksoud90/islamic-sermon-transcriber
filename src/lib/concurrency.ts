export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const effectiveLimit = Math.max(1, Math.min(limit, items.length));

  async function runWorker(): Promise<void> {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  const workers: Promise<void>[] = [];
  for (let i = 0; i < effectiveLimit; i += 1) {
    workers.push(runWorker());
  }

  await Promise.all(workers);
  return results;
}
