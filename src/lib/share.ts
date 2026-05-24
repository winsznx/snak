export const SHARE_HOST = "https://snak.timjosh507.workers.dev";

export function shareText(stake?: string): string {
  if (!stake) return "I'm in a Snak arena. cUSD on the line. Join → ";
  return `Arena live · ${stake} cUSD stake · join → `;
}

export const whatsAppLink = (text: string, url: string) =>
  `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
export const tweetLink = (text: string, url: string) =>
  `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
export const telegramLink = (text: string, url: string) =>
  `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
