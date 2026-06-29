export async function asyncPool<T>(options: {
  concurrency: number;
  items: T[];
  mapper: (item: T, index: number) => Promise<void>;
}): Promise<void> {
  const { concurrency, items, mapper } = options;

  const queue = items.map((item, index) => ({ item, index }));
  const workers: Promise<void>[] = [];

  const worker = async () => {
    while (queue.length) {
      const next = queue.shift();
      if (!next) return;
      await mapper(next.item, next.index);
    }
  };

  const count = Math.max(1, concurrency);
  for (let i = 0; i < count; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
}

