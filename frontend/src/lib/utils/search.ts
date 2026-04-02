export const normalizeSearchTerm = (
    value?: string | null,
    options?: {
        lowerCase?: boolean;
    }
) => {
    const normalized = value?.trim();

    if (!normalized) {
        return undefined;
    }

    return options?.lowerCase ? normalized.toLowerCase() : normalized;
};

export const matchesSearch = (
    values: Array<string | null | undefined>,
    searchTerm?: string
) => {
    const normalizedSearch = normalizeSearchTerm(searchTerm, {
        lowerCase: true,
    });

    if (!normalizedSearch) {
        return true;
    }

    return values.some((value) =>
        normalizeSearchTerm(value, { lowerCase: true })?.includes(
            normalizedSearch
        )
    );
};
