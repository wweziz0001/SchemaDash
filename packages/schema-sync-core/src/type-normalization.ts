const TYPE_ALIAS_MAP = new Map<string, string>([
    ['bool', 'boolean'],
    ['boolean', 'boolean'],
    ['char', 'character'],
    ['character', 'character'],
    ['varchar', 'character varying'],
    ['character varying', 'character varying'],
    ['decimal', 'numeric'],
    ['numeric', 'numeric'],
    ['float4', 'real'],
    ['real', 'real'],
    ['float8', 'double precision'],
    ['double precision', 'double precision'],
    ['int', 'integer'],
    ['int4', 'integer'],
    ['integer', 'integer'],
    ['int2', 'smallint'],
    ['smallint', 'smallint'],
    ['int8', 'bigint'],
    ['bigint', 'bigint'],
    ['time', 'time without time zone'],
    ['time without time zone', 'time without time zone'],
    ['timetz', 'time with time zone'],
    ['time with time zone', 'time with time zone'],
    ['timestamp', 'timestamp without time zone'],
    ['timestamp without time zone', 'timestamp without time zone'],
    ['timestamptz', 'timestamp with time zone'],
    ['timestamp with time zone', 'timestamp with time zone'],
]);

export const normalizeComparableType = (value?: string | null) => {
    if (!value) {
        return null;
    }

    const trimmed = value
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/"/g, '')
        .replace(/^pg_catalog\./i, '')
        .toLowerCase();
    const isArray = trimmed.endsWith('[]');
    const arrayless = isArray ? trimmed.slice(0, -2).trim() : trimmed;
    const match = arrayless.match(/^([a-z0-9_. ]+?)(\((.*)\))?$/i);

    if (!match) {
        return trimmed;
    }

    const baseName = match[1]?.trim() ?? arrayless;
    const normalizedBase = TYPE_ALIAS_MAP.get(baseName) ?? baseName;
    const args = match[3]?.replace(/\s+/g, '') ?? '';
    const normalized = args ? `${normalizedBase}(${args})` : normalizedBase;

    return isArray ? `${normalized}[]` : normalized;
};
