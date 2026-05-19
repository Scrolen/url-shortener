import { env } from "../../config/env.ts";
import { addDays } from "../../utils/addDays.ts";
import { generateShortCode } from "../../utils/shortCode.ts";
import { createLinkWithoutShortCode, findLinkByShortCode, incrementLinkClickCount, updateLinkShortCode } from "./link.repository.ts";
import { CreateLinkInput, ShortCode } from "./link.schema.ts";

type RedirectResult = 
    | {status: "not_found"}
    | {status: "expired"}
    | {status: "ok", url: string};


export async function createLinkService(input: CreateLinkInput) {
    const expiresAt = addDays(new Date(), env.DEFAULT_LINK_TTL_DAYS);

    const createdLink = await createLinkWithoutShortCode({
        longUrl: input.long_url,
        expiresAt: expiresAt,
    });

    const shortCode = generateShortCode(createdLink.id);
    const updatedLink = await updateLinkShortCode(createdLink.id, shortCode);

    return {
        short_url: `${env.BASE_URL}/${shortCode}`,
        short_code: shortCode,
        long_url: updatedLink.longUrl,
        expires_at: updatedLink.expiresAt.toISOString(),
    }
}

export async function getLinkDataService(shortCode: ShortCode) {
    const link = await findLinkByShortCode(shortCode);
    
    if (!link) {
        return null;
    }
    
    return {
        long_url: link.longUrl,
        short_url: `${env.BASE_URL}/${link.shortCode}`,
        short_code: link.shortCode,
        expires_at: link.expiresAt,
        created_at: link.createdAt,
        click_count: Number(link.clickCount)
    }
    
}

export async function linkRedirectService(shortCode: ShortCode): Promise<RedirectResult> {
    const link = await findLinkByShortCode(shortCode);

    if (!link) {
        return {status: "not_found"};
    }

    if (link.expiresAt < new Date()) {
        return {status: "expired"};
    }

    await incrementLinkClickCount(shortCode);

    return {status: "ok", url: link.longUrl};
}