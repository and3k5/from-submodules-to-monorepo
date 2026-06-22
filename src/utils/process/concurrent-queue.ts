import { cpus } from "os";

export function concurrencyFromCpuUsage(cpuUsage: number): number {
    return Math.max(1, Math.round(cpus().length * cpuUsage));
}

/**
 * Creates a queue that limits concurrency and throttles CPU usage via
 * duty-cycle sleeping. After each task completes, the slot is held for
 * `elapsed * (1/cpuUsage - 1)` ms before being released, so the worker
 * is idle for exactly the right fraction of time to hit the target ratio.
 *
 * cpuUsage = 0.5 → sleep as long as the task took (50% duty cycle)
 * cpuUsage = 0.8 → sleep for 25% of task time (80% duty cycle)
 * cpuUsage = 1.0 → no sleep
 */
export function createConcurrentQueue(
    maxConcurrency: number,
    cpuUsage: number = 1.0,
) {
    let running = 0;
    const pending: Array<() => void> = [];

    function tryNext() {
        if (pending.length > 0 && running < maxConcurrency) {
            running++;
            pending.shift()!();
        }
    }

    async function enqueue<T>(task: () => Promise<T>): Promise<T> {
        if (running < maxConcurrency) {
            running++;
        } else {
            await new Promise<void>((resolve) => pending.push(resolve));
        }
        const startMs = Date.now();
        try {
            return await task();
        } finally {
            if (cpuUsage < 1.0) {
                const elapsed = Date.now() - startMs;
                const sleepMs = Math.round(elapsed * (1 / cpuUsage - 1));
                if (sleepMs > 0) {
                    await new Promise<void>((resolve) =>
                        setTimeout(resolve, sleepMs),
                    );
                }
            }
            running--;
            tryNext();
        }
    }

    return { enqueue };
}
