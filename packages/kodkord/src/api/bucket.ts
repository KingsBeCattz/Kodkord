import { Warn } from "@common/log";

/** A task to be processed by the bucket. */
export type Task<Type> = (
	resolve: (value: Type) => void,
	reject: (reason?: unknown) => void,
) => void;

/**
 * A rate-limit-aware task processor.
 *
 * Processes tasks in order while respecting a specific rate limit. Used primarily for API calls requiring rate-limit management, such as Discord's API.
 */
export class Bucket {
	/** Whether the bucket is paused and not processing tasks. */
	private paused: boolean;

	/** Queue of tasks to be processed. */
	private queue: Task<unknown>[];

	/** Remaining requests in the current rate limit window. */
	public remaining: number;

	/** Maximum number of requests allowed per rate limit window. */
	public limit: number;

	/** Timestamp when the current rate limit window resets. */
	public reset: number;

	/**
	 * Creates a new `Bucket` instance.
	 *
	 * @param limit Maximum number of tasks allowed in the rate limit window. Defaults to 1.
	 * @param reset Initial timestamp when the rate limit window resets. Defaults to the current time.
	 */
	public constructor(limit = 1, reset: number = Date.now()) {
		this.paused = false;
		this.remaining = limit;
		this.limit = limit;
		this.reset = reset;
		this.queue = [];
	}

	/**
	 * Processes tasks in the queue while respecting the rate limit.
	 *
	 * If the rate limit is reached, waits until the reset time before continuing.
	 *
	 * @param override If `true`, forces processing even if another process is already active. Defaults to `false`.
	 * @returns Resolves when all tasks in the queue are processed.
	 */
	public async process(): Promise<void> {
		if (this.queue.length === 0) {
			this.resetState();
			return;
		}

		while (this.queue.length > 0 && !this.paused) {
			// Check rate limit
			if (this.remaining <= 0) {
				const NOW_SECONDS = Date.now() / 1_000 | 0; // Evil Math.floor
				if (NOW_SECONDS < this.reset) {
					const WAIT_SECONDS = this.reset - NOW_SECONDS;
					new Warn("Bucket", `Rate limit reached. Waiting ${WAIT_SECONDS}s.`).warn();
					await new Promise((resolve) => {
						setTimeout(resolve, WAIT_SECONDS * 1_000);
					});
				}
				this.resetState(); // Reset the state after the rate limit resets
			}

			const TASK = this.queue.shift();
			if (TASK) {
				this.remaining--;
				await new Promise(TASK);
			}
		}
	}

	/**
	 * Adds a new task to the queue.
	 *
	 * If a position is provided, the task will be inserted at that position in the queue. Otherwise, it is added to the end.
	 *
	 * @param task The task to add.
	 * @param at Optional position to insert the task in the queue.
	 */
	public async add<Type>(task: Task<Type>, at?: number): Promise<void> {
		if (at === undefined) {
			this.queue.push(task);
		} else {
			this.queue.splice(at, 0, task);
		}

		await this.process();
	}

	/**
	 * Resets the state of the bucket.
	 *
	 * Clears the task queue, resets rate-limit counters, and marks the bucket as ready to process tasks.
	 */
	public resetState(): void {
		this.paused = false;
		this.remaining = this.limit;
		this.reset = Date.now();
		this.queue = [];
	}

	/** Pauses task processing. */
	public pause(): void {
		this.paused = true;
	}

	/**
	 * Resumes task processing if paused.
	 *
	 * Tasks in the queue will start processing again.
	 */
	public async resume(): Promise<void> {
		this.paused = false;
		await this.process();
	}
}
