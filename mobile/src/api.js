export function normalizeServer(value) {
  let text = value
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/v1$/, "");
  if (!/^https?:\/\//i.test(text)) text = "http://" + text;
  let url;
  try {
    url = new URL(text);
  } catch {
    throw new Error(
      "Informe um endereço válido. Ex.: http://192.168.1.10:8000",
    );
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    !url.hostname ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname && url.pathname !== "/")
  ) {
    throw new Error(
      "Use apenas o endereço do servidor, sem caminho, usuário ou senha.",
    );
  }
  return text.replace(/\/+$/, "");
}
export async function request(
  base,
  route,
  { token, method = "GET", data, signal } = {},
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  try {
    const response = await fetch(base + "/api/v1/" + route, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
      signal: controller.signal,
    });
    let body;
    try {
      body = await response.json();
    } catch {
      throw new Error(
        "O endereço respondeu, mas não é a API do EletroStock. Confira o servidor e a porta 8000.",
      );
    }
    if (!response.ok) {
      const err = new Error(
        body.error || "Não foi possível concluir a operação.",
      );
      err.fields = body.fields || {};
      err.status = response.status;
      throw err;
    }
    return body;
  } catch (error) {
    if (error.name === "AbortError")
      throw new Error(
        "O servidor demorou para responder. Confira o Wi-Fi, o endereço e se o Django está aberto.",
      );
    if (error instanceof TypeError)
      throw new Error(
        "Não foi possível conectar. Deixe o celular e o computador no mesmo Wi-Fi, execute INICIAR_API_MOBILE.bat e confira o endereço.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
export const decimalInput = (value) =>
  String(value ?? "")
    .trim()
    .replace(",", ".");
