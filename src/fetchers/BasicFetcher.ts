import { TFetchStrategy } from '@src/types';

export default class BasicFetcher<T> implements TFetchStrategy<T> {
	private readonly values: Map<string, T | null> = new Map();
	private readonly defaultTimeout: number = 100;
	private readonly timeoutMap: Map<string, number> = new Map();

	setReturnValue(id: string, value: T | null, timeout: number = this.defaultTimeout): void {
		this.values.set(id, value);
		this.timeoutMap.set(id, timeout);
	}

	unsetReturnValue(id: string): void {
		this.values.delete(id);
	}

	clearReturnValues(): void {
		this.values.clear();
	}

	fetch(id: string): Promise<T | null> {
		return new Promise((resolve) => {
			const timeout = this.timeoutMap.get(id) || this.defaultTimeout;
			setTimeout(() => {
				resolve(this.values.get(id) || null);
			}, timeout);
		});
	}
}
