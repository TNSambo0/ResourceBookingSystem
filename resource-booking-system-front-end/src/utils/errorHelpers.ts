export function getErrorMessage(payload: unknown): string {
    if (typeof payload === 'string') return payload;
    if (payload && typeof payload === 'object' && 'message' in payload) {
        return (payload as { message: string }).message;
    }
    return 'Something went wrong.';
}
