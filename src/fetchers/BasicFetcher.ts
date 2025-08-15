import { TFetchStrategy } from '@src/types';

export default class BasicFetcher<T> implements TFetchStrategy<T> {
	private values: Map<string, T | null> = new Map();

	setReturnValue(id: string, value: T | null): void {
		this.values.set(id, value);
	}

	unsetReturnValue(id: string): void {
		this.values.delete(id);
	}

	clearReturnValues(): void {
		this.values.clear();
	}

	fetch(id: string): Promise<T | null> {
		return Promise.resolve(this.values.get(id) || null);
	}
}
