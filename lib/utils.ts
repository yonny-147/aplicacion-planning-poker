import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: any[]) {
    return twMerge(clsx(inputs));
}

export function generateRoomCode(length = 6) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export function generateParticipantId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
export function isValidRoomCode(code: string) {
    return /^[A-Z0-9]{4,8}$/.test(code);
}
