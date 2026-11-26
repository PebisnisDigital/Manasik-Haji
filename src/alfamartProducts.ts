export const ALFAMART_PRODUCTS = [
  { name: 'Air mineral', price: 5000, pitch: 'Permisi, mau air mineral dingin?', reply: 'Boleh, kebetulan saya sedang haus.' },
  { name: 'Roti', price: 8000, pitch: 'Permisi, mau roti untuk bekal?', reply: 'Boleh, saya perlu bekal.' },
  { name: 'Minuman teh', price: 6000, pitch: 'Permisi, mau minuman teh dingin?', reply: 'Boleh, saya ingin teh dingin.' },
  { name: 'Biskuit', price: 10000, pitch: 'Permisi, mau biskuit untuk camilan?', reply: 'Boleh, saya sedang mencari camilan.' },
  { name: 'Susu', price: 9000, pitch: 'Permisi, mau susu?', reply: 'Boleh, susunya buat di rumah.' },
  { name: 'Mi instan', price: 3500, pitch: 'Permisi, mau mi instan untuk stok dapur?', reply: 'Boleh, stok di rumah sudah habis.' },
  { name: 'Paket makanan ringan', price: 15000, pitch: 'Permisi, mau paket makanan ringan?', reply: 'Boleh, pas untuk dibagi dengan teman.' },
] as const;

export const ALFAMART_SALES = {
  commission: 3000, target: 10, voucher: 25000, registration: 100000,
} as const;

export function alfamartOffers(id: number) {
  return [id % ALFAMART_PRODUCTS.length, (id + 3) % ALFAMART_PRODUCTS.length];
}

export function alfamartResponse(id: number, product: number) {
  const item = ALFAMART_PRODUCTS[product];
  if (!item || id % 4 === 3 || product !== alfamartOffers(id)[0]) {
    return { ok: false, line: 'Terima kasih, saya belum membutuhkan produk itu.' };
  }
  return { ok: true, line: item.reply };
}
