import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestContextStore {
    requestId: string;
}

const requestContext = new AsyncLocalStorage<RequestContextStore>();

export const setRequestContext = (store: RequestContextStore) => {
    requestContext.enterWith(store);
};

export const getRequestId = (): string | null =>
    requestContext.getStore()?.requestId ?? null;
