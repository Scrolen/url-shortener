import { prisma } from "../../db/prisma.ts";
import { ShortCode } from "./link.schema.ts";

type CreateLinkRecordInput = {
  longUrl: string;
  expiresAt: Date;
};

export async function createLinkWithoutShortCode (data: CreateLinkRecordInput) {
    return prisma.link.create({
        data: {
            longUrl: data.longUrl,
            expiresAt: data.expiresAt,
        },
    });
}

export async function updateLinkShortCode(id:number, shortCode: string) {
    return prisma.link.update({
        where: {
            id: id,
        },
        data: {
            shortCode: shortCode
        },
    });
}

export async function findLinkByShortCode(shortCode: ShortCode) {
    return prisma.link.findUnique({
        where: {
            shortCode: shortCode,
        },
    })
}

export async function incrementLinkClickCount(shortCode: ShortCode, amount: number = 1) {
    return prisma.link.update({
        where: {
            shortCode: shortCode,
        },
        data: {
            clickCount: {
                increment: amount,
            },
        },
    });

}