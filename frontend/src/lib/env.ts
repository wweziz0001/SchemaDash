const runtimeEnv = typeof window !== 'undefined' ? (window.env ?? {}) : {};
const hideSchemaDashCloud =
    runtimeEnv.HIDE_SCHEMADASH_CLOUD ??
    runtimeEnv.HIDE_CHARTDB_CLOUD ??
    import.meta.env.VITE_HIDE_SCHEMADASH_CLOUD ??
    import.meta.env.VITE_HIDE_CHARTDB_CLOUD;
const disableAnalytics =
    runtimeEnv.DISABLE_ANALYTICS ?? import.meta.env.VITE_DISABLE_ANALYTICS;

export const OPENAI_API_KEY: string = import.meta.env.VITE_OPENAI_API_KEY;
export const OPENAI_API_ENDPOINT: string = import.meta.env
    .VITE_OPENAI_API_ENDPOINT;
export const LLM_MODEL_NAME: string = import.meta.env.VITE_LLM_MODEL_NAME;
export const IS_SCHEMADASH_IO: boolean =
    import.meta.env.VITE_IS_SCHEMADASH_IO === 'true' ||
    import.meta.env.VITE_IS_CHARTDB_IO === 'true';
export const IS_CHARTDB_IO: boolean = IS_SCHEMADASH_IO;
export const APP_URL: string = import.meta.env.VITE_APP_URL;
export const HOST_URL: string = import.meta.env.VITE_HOST_URL ?? '';
export const API_BASE_URL: string =
    runtimeEnv.API_BASE_URL ?? import.meta.env.VITE_API_BASE_URL ?? '';
export const HIDE_SCHEMADASH_CLOUD: boolean = hideSchemaDashCloud === 'true';
export const HIDE_CHARTDB_CLOUD: boolean = HIDE_SCHEMADASH_CLOUD;
export const DISABLE_ANALYTICS: boolean = disableAnalytics === 'true';
