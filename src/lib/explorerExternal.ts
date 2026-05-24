export function metamaskAddTokenUrl(token: string, symbol = "cUSD", decimals = 18): string {
  const params = new URLSearchParams({
    type: "ERC20",
    address: token,
    symbol,
    decimals: decimals.toString(),
  });
  return `metamask://wallet/asset/add?${params.toString()}`;
}

export function miniPayInstallUrl(): string {
  return "https://www.opera.com/products/minipay";
}

export function valoraDeepLink(path: string): string {
  return `celo://wallet${path.startsWith("/") ? path : `/${path}`}`;
}
