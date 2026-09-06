import crypto from 'crypto';

export function computeSHA256(buffer) {
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    return `0x${hash}`;
}
